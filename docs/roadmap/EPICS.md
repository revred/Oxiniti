# Oxyniti — Epics

Each epic rolls up to a goal in [GOALS.md](GOALS.md) and breaks down into
features in [FEATURES.md](FEATURES.md). Priority is P0 (blocking/losing
business today) → P2 (polish/growth).

## Under G1 — Close the credibility gap

### E1.1 — Stub or ship every promised destination (P0)
The footer and nav link to nine routes that don't exist:
`/faqs`, `/installation-guides`, `/warranty`, `/shipping`, `/quote`, `/terms`,
`/privacy`, `/sitemap`, and `/blog` (mismatched — the real route is `/blogs`
and even that is a bare "Coming Soon" stub). Fix by either building real
content (support/legal pages) or, at minimum, a consistent "Coming Soon" stub
like the one already used for `/blogs` and `/documentation` — never a raw 404.

### E1.2 — Ship the missing Account page (P0)
`MainLayout.razor`'s user dropdown links to `href="account"` — there is no
`Pages/Account.razor`. Any logged-in user who clicks their own account menu
hits a dead route.

## Under G2 — Discovery-to-purchase actually works

### E2.1 — Wire up product search end to end (P0)
Two broken search entry points: the header `SearchBox.razor` navigates to
`/search?q=...`, a route with no page; and `Products.razor`'s
`ExploreProductRange` binding never fires `SearchTermChanged` because the
inner input binds to the parameter directly, not the component's backing
property, so the page's own search box is fully inert.

### E2.2 — Real order confirmation & post-purchase visibility (P1)
`CheckoutReturn.razor` is a static "Thank You!" — no order number, no
Stripe `session_id` verification, no link to `/orders`. A customer who just
paid gets no actionable confirmation.

### E2.3 — Password recovery flow (P1)
`Login.razor`'s "Forgot Password?" is `href="#"`. No self-serve recovery path
exists; every locked-out user has to be manually unblocked or abandons.

### E2.4 — Cart quantity editing (P1)
`Cart.razor` shows each line's quantity as plain text with no way to change
it — only "Remove" and "View Details →" exist. `CartService.AddToCartCore`
already sets quantity for an existing line (`existing.Quantity =
finalQuantity`), so the underlying data path supports this; the gap is
purely that the Cart page has no UI to change quantity without removing the
item and re-adding it from the product page.

## Under G3 — Pre-sale and post-sale content for industrial buyers

### E3.1 — Support & policy content hub (P1)
Build the real destinations for FAQs, Warranty & Returns, Shipping/Lead-time
Info, Installation Guides, Terms & Conditions, Privacy Policy, and Sitemap —
currently all promised, none real (shares scope with E1.1; sequence together).

### E3.2 — Custom quote request flow (P1)
Footer promises "Request a Custom Quote" — appropriate for large
aquaculture/wastewater installations that won't go through self-serve
checkout. No such flow/page exists today.

### E3.3 — Wire the Contact form to a real destination (P0)
`Contact.razor`'s `HandleValidSubmit` has a literal
`// TODO: wire up email or API call` and only does `Console.WriteLine`. Every
message submitted today is silently discarded — this is actively losing
inbound sales leads right now, independent of any other roadmap sequencing.

## Under G4 — Brand consistency & production readiness

### E4.1 — Brand consistency pass (P1)
Reconcile "Oxyniti - Natural Innovation" (title/tagline) against the About
page's "Revaron designs and manufactures..." copy — pick one brand story and
apply it consistently across `index.html` title, Home `PageTitle`, and About
copy.

### E4.2 — SEO & metadata foundation (P2)
`index.html` has no meta description or Open Graph tags; only Home and
ProductDetails set a per-page `<PageTitle>` — Products, Cart, Checkout,
Orders, About, Contact, Login, Register all render under the bare default
`<title>Oxyniti</title>`.

### E4.3 — Go-live readiness checklist (P0 before any real launch)
`wwwroot/appsettings.json` ships a Stripe **test** publishable key
(`pk_test_...`) — real payments cannot be taken today. Also clean up the
unused `icon-192.png` (no `manifest.json` references it) and confirm the
Stripe `ReturnUrl` behaves correctly behind the production base address.

## Under G5 — Maker AI enterprise path

### E5.1 — Surface the Maker AI SSO path earlier in the funnel (P2)
`GoToMakerAIAsync` in `MainLayout.razor` only appears in the logged-in user
dropdown for accounts already flagged `IsMakerAIUser`. Add a discoverable
"Enterprise / MES customers" entry point (e.g. on `/about` or a dedicated
`/enterprise` page) so prospective business customers can find this path
before they're already a recognized account.

## Under G6 — Turn organic + paid search into qualified pond-demo leads

### E6.1 — Homepage & entity SEO rewrite (P0)
Homepage `<title>`/H1 lead with the brand slogan rather than the buyer-intent
terms farmers actually search ("nano bubble generator", "fish farming",
"aquaculture"). A similarly-named Indian competitor ("Oxynity") means Oxyniti
also needs a consistent category descriptor doing double duty as entity
disambiguation, not just SEO.

### E6.2 — `/pond-demo` lead-capture funnel (P0)
No low-friction lead offer exists — every page today asks a visitor to
evaluate a capital purchase outright. This is the page the paid-search
campaign (OWNER_ACTIONS.md) sends traffic to; it doesn't exist yet. **Must
not repeat E3.3's `Contact.razor` failure** (`// TODO: wire up email or API
call`, `Console.WriteLine`-only submission) — share E3.3's fix once shipped,
or wire independently to a real destination from the start.

### E6.3 — Structured-data enrichment for Merchant Center & disambiguation (P1)
Product/Offer schema needs `availability`, SKU/MPN, shipping and return-policy
fields before Merchant Center free listings are viable. Organization/
LocalBusiness schema needs `legalName`, `address`, `email`, `sameAs` — the
exact signals that disambiguate Oxyniti from "Oxynity" in search.

### E6.4 — Conversion-tracking scaffolding (P1)
No GA4/Ads event tracking exists anywhere in the codebase today. Without it,
the "cost per qualified pond" measurement the advisory recommends has nothing
to attach to, however well the $1/day campaign is targeted.

### E6.5 — Case-study page template (P1)
`/blogs` exists only as a bare "Coming Soon" stub (E1.1). Real field data
(DO before/after, species, stocking density per installation) needs a
repeatable page structure — this epic is the template only; real content
depends on the field visits in OWNER_ACTIONS.md.

### E6.6 — Localise the money pages: Tamil, then Telugu (P2)
Localized-route infrastructure already exists for 7 languages, but the pages
that actually drive a sale aren't translated — a local-language searcher
today lands on a translated nav shell wrapped around English sales copy.
