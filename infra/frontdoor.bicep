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
// Not covered here (see infra/README.md "Not included"):
//   - the apex-domain (oxyniti.com, no "www") insecure HTTP forward, which
//     is a registrar-level domain-forwarding setting, not an Azure resource
//   - a second region for the maker-rest-api backend (owned by a different
//     repo/service)
//   - WAF (requires the Premium SKU, not provisioned here to keep cost down)

@description('Default hostname of the Static Web App, e.g. delightful-flower-0fedcf103.3.azurestaticapps.net. Found via `az staticwebapp show`.')
param staticWebAppDefaultHostname string

@description('Apex domain, e.g. oxyniti.com')
param apexDomain string = 'oxyniti.com'

@description('www subdomain, e.g. www.oxyniti.com')
param wwwDomain string = 'www.oxyniti.com'

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

output frontDoorEndpointHostname string = endpoint.properties.hostName
output apexDomainValidationToken string = apexCustomDomain.properties.validationProperties.validationToken
output wwwDomainValidationToken string = wwwCustomDomain.properties.validationProperties.validationToken
