// Azure Front Door Standard in front of the existing Static Web App.
//
// Fixes issue #36: static assets currently go straight to the Static Web
// App's default hostname with no edge cache in front of it, so every byte
// travels from wherever SWA's Traffic Manager happens to route the request
// (measured as Hong Kong for Indian visitors) instead of a nearby PoP, and
// nothing is ever served from cache (no x-azure-ref / age headers).
//
// This template is NOT applied by any pipeline in this repo. Deploy it
// yourself with the Azure CLI once you've reviewed it — see infra/README.md.
//
// Also fronts the maker-rest-api backend behind the same profile (issue #36
// item 5's "or Azure Front Door origin group" option): the API itself still
// only exists in UK South -- this repo doesn't own that service, so it can't
// move it -- but routing it through Front Door means the visitor's TLS/TCP
// handshake lands at a nearby PoP and rides Microsoft's backbone network for
// the UK South hop instead of the public internet. It's an acceleration, not
// a second region.
//
// Not covered here (see infra/README.md "Not included"):
//   - the apex-domain (oxyniti.com, no "www") insecure HTTP forward, which
//     is a registrar-level domain-forwarding setting, not an Azure resource
//   - an actual second region for the maker-rest-api backend (owned by a
//     different repo/service)
//   - WAF (requires the Premium SKU, not provisioned here to keep cost down)

@description('Default hostname of the Static Web App, e.g. delightful-flower-0fedcf103.3.azurestaticapps.net. Found via `az staticwebapp show`.')
param staticWebAppDefaultHostname string

@description('Apex domain, e.g. oxyniti.com')
param apexDomain string = 'oxyniti.com'

@description('www subdomain, e.g. www.oxyniti.com')
param wwwDomain string = 'www.oxyniti.com'

@description('Hostname of the existing maker-rest-api backend (GetBusinessInfo etc.), e.g. maker-rest-api-e5c2djh7aafkace8.uksouth-01.azurewebsites.net.')
param apiOriginHostname string = 'maker-rest-api-e5c2djh7aafkace8.uksouth-01.azurewebsites.net'

@description('Subdomain to expose the API through Front Door on, e.g. api.oxyniti.com. Point wwwroot/appsettings.json RampEdge.BaseAddress at this only after its DNS is live -- see infra/README.md.')
param apiSubdomain string = 'api.oxyniti.com'

@description('Front Door profile name.')
param profileName string = 'oxyniti-fd'

@description('Front Door SKU. Standard gets global PoPs + HTTP/3 + edge caching. Premium adds WAF + Private Link, at extra cost.')
@allowed([
  'Standard_AzureFrontDoor'
  'Premium_AzureFrontDoor'
])
param skuName string = 'Standard_AzureFrontDoor'

var endpointName = '${profileName}-ep'
var originGroupName = 'swa-origin-group'
var originName = 'swa-origin'
var routeName = 'default-route'
var apiOriginGroupName = 'api-origin-group'
var apiOriginName = 'api-origin'
var apiRouteName = 'api-route'

resource profile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: profileName
  location: 'global'
  sku: {
    name: skuName
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: profile
  name: endpointName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
    // HTTP/3 (QUIC) is negotiated automatically by Front Door Standard/Premium
    // endpoints for clients that support it -- there is no separate toggle.
  }
}

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: profile
  name: originGroupName
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}

resource origin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: originGroup
  name: originName
  properties: {
    hostName: staticWebAppDefaultHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: staticWebAppDefaultHostname
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource apexCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = {
  parent: profile
  name: 'oxyniti-com'
  properties: {
    hostName: apexDomain
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

resource wwwCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = {
  parent: profile
  name: 'www-oxyniti-com'
  properties: {
    hostName: wwwDomain
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

resource route 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: routeName
  dependsOn: [
    origin
  ]
  properties: {
    originGroup: {
      id: originGroup.id
    }
    customDomains: [
      {
        id: apexCustomDomain.id
      }
      {
        id: wwwCustomDomain.id
      }
    ]
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    // The origin (Static Web App, via staticwebapp.config.json) already sets
    // Cache-Control per file type -- Front Door honors those and caches
    // accordingly. UseQueryString so the ?v=2 cache-buster on /oxyniti.png
    // keeps working instead of being collapsed away.
    cacheConfiguration: {
      queryStringCachingBehavior: 'UseQueryString'
      compressionSettings: {
        isCompressionEnabled: true
        contentTypesToCompress: [
          'text/html'
          'text/css'
          'text/javascript'
          'application/javascript'
          'application/json'
          'application/wasm'
          'image/svg+xml'
        ]
      }
    }
  }
}

resource apiOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: profile
  name: apiOriginGroupName
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      // Adjust probePath if the API doesn't respond 2xx/3xx/4xx on "/" --
      // any non-5xx response counts as healthy for Front Door's purposes.
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}

resource apiOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: apiOriginGroup
  name: apiOriginName
  properties: {
    hostName: apiOriginHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: apiOriginHostname
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource apiCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = {
  parent: profile
  name: 'api-oxyniti-com'
  properties: {
    hostName: apiSubdomain
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

resource apiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: apiRouteName
  dependsOn: [
    apiOrigin
  ]
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    customDomains: [
      {
        id: apiCustomDomain.id
      }
    ]
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    // No cacheConfiguration here on purpose -- GetBusinessInfo and friends
    // are dynamic CMS reads, not static assets. This route only buys the
    // nearby-PoP TLS handshake + Microsoft backbone hop to UK South, not
    // caching.
  }
}

output frontDoorEndpointHostname string = endpoint.properties.hostName
output apexDomainValidationToken string = apexCustomDomain.properties.validationProperties.validationToken
output wwwDomainValidationToken string = wwwCustomDomain.properties.validationProperties.validationToken
output apiDomainValidationToken string = apiCustomDomain.properties.validationProperties.validationToken
