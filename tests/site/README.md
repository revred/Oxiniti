# Site browser tests

Playwright smoke tests for pages the site builds around other code — today
`/yield-calculator` and the home page's section links (`/?scrollTo=...`) (the calculator's own model tests live upstream in
vivian4fb/oxyniti-yield-calc).

```sh
cd tests/site
npm install
npx playwright install chromium   # first time only
npm test
```

The config starts `dotnet run` on port 5199 (or reuses a server already
there). To test a running site instead: `OXY_BASE_URL=http://localhost:5184 npm test`.

Each test runs at a desktop and a phone size. The WhatsApp test only reads the
link it builds; it never opens it, and `leads.config.js` has no POST endpoint.
