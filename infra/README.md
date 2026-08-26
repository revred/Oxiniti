# Front Door in front of the site (issue #36)

`infra/frontdoor.bicep` puts Azure Front Door Standard in front of the
existing Static Web App: real edge PoPs (including India), HTTP/3 to
clients that support it, and actual edge caching (the site currently has
none of that — every request goes straight to wherever SWA's Traffic
Manager routes it, measured as Hong Kong for Indian visitors, with no
cache tier and no `x-azure-ref`/`age` headers).

**This template has not been deployed.** No pipeline in this repo applies
it. Review it, then deploy it yourself with your own Azure credentials.

## What it deploys

- An Azure Front Door Standard profile + endpoint
- An origin group pointing at the Static Web App's existing default
  hostname (`*.azurestaticapps.net`) — nothing changes on the SWA itself
- A route with HTTPS-only forwarding, compression, and
  `queryStringCachingBehavior: UseQueryString` (so `/oxyniti.png?v=2`
  keeps busting cache correctly)
- Custom domain resources for `oxyniti.com` and `www.oxyniti.com`
- A **second** origin group + route + custom domain (`api.oxyniti.com`)
  fronting the existing `maker-rest-api-*.azurewebsites.net` backend — see
  "The API leg" below before wiring the app up to it

Front Door honors the `Cache-Control` headers `staticwebapp.config.json`
already sets (from #29) — that's why #29 had to land first.

### The API leg — what it does and doesn't do

Issue #36 item 5 offers two options: a second API region, or a Front Door
origin group. This template does the latter, because `maker-rest-api` isn't
part of this repo — this repo can't move it to a second region. Routing it
through Front Door instead means the browser's TLS/TCP handshake lands at
a nearby PoP and the UK South hop rides Microsoft's backbone network rather
than the public internet. That's a real latency win, but it does **not**
eliminate the UK round trip the way a second region would — `GetBusinessInfo`
still ultimately executes in UK South.

**Do not** point `wwwroot/appsettings.json`'s `RampEdge.BaseAddress` at
`https://api.oxyniti.com` until that domain's DNS is live and validated
(step-by-step below) — flipping it earlier would break every `GetBusinessInfo`
call in production, since the domain wouldn't resolve yet. Once validated,
that's a one-line config change in a follow-up PR, not something to bundle
into this infra change.

## Deploy

```bash
az login

az deployment group create \
  --resource-group <your-resource-group> \
  --template-file infra/frontdoor.bicep \
  --parameters staticWebAppDefaultHostname=delightful-flower-0fedcf103.3.azurestaticapps.net
```

(That hostname is `www.oxyniti.com`'s current CNAME target, confirmed via
`dig`/`nslookup` on 2026-08-26. Re-confirm with
`az staticwebapp show --name <name> --query defaultHostname -o tsv` in
case it's rotated since.)

I could not run `bicep build` or `az deployment group validate` against
this template — there's no Azure CLI in the environment I authored it in.
Run one of those (or `--what-if`) before applying for real.

Grab the outputs:

```bash
az deployment group show -g <rg> -n frontdoor \
  --query 'properties.outputs.{fd:frontDoorEndpointHostname.value, apexToken:apexDomainValidationToken.value, wwwToken:wwwDomainValidationToken.value, apiToken:apiDomainValidationToken.value}'
```

## DNS changes (at your registrar / DNS host)

This is the part that actually fixes #36 and requires registrar access I
don't have.

1. **Domain validation** — add TXT records so Front Door can prove you own
   the domains (skip this step if you migrate the zone to Azure DNS and
   link it instead, which lets Front Door auto-validate):
   - `_dnsauth.oxyniti.com` → `<apexDomainValidationToken output>`
   - `_dnsauth.www.oxyniti.com` → `<wwwDomainValidationToken output>`
   - `_dnsauth.api.oxyniti.com` → `<apiDomainValidationToken output>`
2. **`www.oxyniti.com`** — change the existing CNAME from
   `delightful-flower-0fedcf103.3.azurestaticapps.net` to the
   `frontDoorEndpointHostname` output (a `*.z01.azurefd.net`-style name).
3. **`api.oxyniti.com`** — new CNAME, also pointed at
   `frontDoorEndpointHostname`. Once this validates, that's the point to
   open the follow-up PR flipping `RampEdge.BaseAddress` (see "The API leg"
   above) — not before.
4. **`oxyniti.com` (apex)** — a bare apex can't be a CNAME. Use whatever
   ALIAS/ANAME/flattened-CNAME feature your DNS host offers, pointed at the
   same `frontDoorEndpointHostname`. **This also replaces the existing
   apex config** — right now `oxyniti.com` resolves to `15.197.225.128` /
   `3.33.251.168` (registrar domain-forwarding, GoDaddy's IP range) and
   301-redirects to **`http://oxyniti.com`**, downgrading to plain HTTP.
   That's a separate bug from #36 worth fixing in the same pass: turn off
   the registrar's HTTP-forwarding feature for the apex entirely once the
   ALIAS record is live.
5. Wait for `domainValidationState` to reach `Approved` on all three custom
   domains (`az afd custom-domain list ...` or the portal), then confirm
   live:
   ```bash
   curl -I https://www.oxyniti.com   # look for x-azure-ref and an age header on a repeat request
   curl -I https://oxyniti.com       # should now be a clean https 200/redirect, not an http downgrade
   curl -I https://api.oxyniti.com   # should reach maker-rest-api through Front Door
   ```

## Not included here

- **WAF** — needs the Premium SKU (`skuName: 'Premium_AzureFrontDoor'` in
  the template), left out to keep this on the cheaper Standard tier.
  Switch the parameter if you want it.
- **An actual second API region for `GetBusinessInfo`** (issue #36 item 5's
  other option) — that backend (`maker-rest-api-*.azurewebsites.net`) isn't
  part of this repo; duplicating its region is a call for whoever owns that
  service. This template does the origin-group-acceleration option instead
  (see "The API leg" above), which is weaker but doesn't require touching
  another team's service.
- **A dedicated video host** — not needed as a separate step; once Front
  Door fronts the whole Static Web App, `/videos/*` is served through the
  edge along with everything else.
- Actually running the deployment and the DNS cutover — needs your Azure
  subscription and registrar access, and it's a production DNS change I
  shouldn't make unilaterally even if I had the credentials.
