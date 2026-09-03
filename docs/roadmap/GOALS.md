# Oxyniti — Product Goals

> Source: derived directly from the current codebase (Blazor WebAssembly storefront,
> `Maker.RampEdge` backend client, Stripe embedded checkout) — not invented. Every
> gap referenced below was verified by reading the actual page/component source
> before writing this backlog. See [EPICS.md](EPICS.md) → [FEATURES.md](FEATURES.md)
> → [STORIES.md](STORIES.md) for the breakdown, and each story for the exact
> file/route it touches.
>
> **What Oxyniti actually is today:** a B2C-styled e-commerce storefront (Products,
> Cart, Checkout, Orders, Login/Register, Stripe embedded checkout) selling
> industrial nanobubble-generator equipment (aquaculture / wastewater treatment /
> hydroponics oxygenation systems), built by "Revaron" per the About page copy,
> with an enterprise back-door: a "Go To Maker AI" SSO link for
> `IsMakerAIUser` accounts into a related MES/ops platform.

## G1 — Close the credibility gap: every visible link must lead somewhere real

**Why:** The footer ([Footer.razor](../../Pages/Components/Footer.razor)) promises
FAQs, Installation Guides, Warranty & Returns, Shipping Info, Request a Custom
Quote, Terms & Conditions, Privacy Policy, and Sitemap. **None of these pages
exist** in `Pages/`. The user menu links to `/account` — **no Account page
exists**. The header search box and the Products-page search box both look
functional but **do not lead anywhere real** (see G2). For a buyer evaluating a
capital-equipment purchase (nanobubble generators, likely $1k–$100k+ per
system), a storefront full of dead links reads as unfinished or untrustworthy
and will suppress conversion before a lead is even captured.

**How to apply:** Treat every dead link found in this audit as a P0/P1 defect,
not a nice-to-have. Either ship the real destination or remove the promise —
never leave a link pointing at nothing.

## G2 — Make discovery-to-purchase actually work end to end

**Why:** Search is visually present in two places (`SearchBox.razor` in the
header, `ExploreProductRange.razor` on `/products`) but **neither is wired to a
result** — the header box navigates to `/search`, a route that doesn't exist;
the Products-page box's `SearchTermChanged` callback is never actually invoked
because the inner `<input>` binds to the parent `SearchTerm` parameter directly
instead of the component's own backing property, so keystrokes never reach
`Products.razor`'s `LoadProducts()`. Checkout otherwise works (addresses →
Stripe embedded checkout → `/checkout/return`), but the return page
([CheckoutReturn.razor](../../Pages/CheckoutReturn.razor)) is a static "Thank
You!" with no order number, no link to `/orders`, and doesn't read the
`session_id` query param Stripe returns — a paying customer gets no
confirmation they can act on.

**How to apply:** Prioritize the search fix and the order-confirmation fix
above net-new features — a broken core purchase loop is more damaging than a
missing nice-to-have page.

## G3 — Give industrial buyers the pre-sale and post-sale content they need

**Why:** This is not impulse-buy consumer retail — a wastewater-treatment
operator or aquaculture farm choosing a nanobubble system needs specs,
installation requirements, warranty terms, shipping/lead-time expectations, and
often a **custom quote** rather than a self-serve checkout (the footer already
promises "Request a Custom Quote" — it just isn't built). The Contact form
([Contact.razor](../../Pages/Contact.razor)) has a literal
`// TODO: wire up email or API call` — every message typed into it today is
lost.

**How to apply:** Sequence this content/flow work after G1/G2 (don't build a
quote-request funnel on top of dead nav links), but treat the Contact-form TODO
as a P0 — it is actively losing real inbound leads right now.

## G4 — Resolve brand inconsistency and reach genuine production readiness

**Why:** The app title is "Oxyniti" and `PageTitle` on Home reads
"Oxyniti - Natural Innovation," but the About page's actual body copy describes
the company as **"Revaron"** manufacturing nanobubble generators — a real,
visible brand mismatch a buyer will notice. Most pages have no `<PageTitle>` or
meta description (only Home and ProductDetails set one) — no SEO signal beyond
the bare `<title>Oxyniti</title>` in `index.html`. The Stripe key in
`wwwroot/appsettings.json` is `pk_test_...` — **the site cannot take a real
payment today**. There's no password-reset flow (`Login.razor`'s "Forgot
Password?" is `href="#"`).

**How to apply:** This goal gates an actual launch. Don't treat "go live" as
implicitly done — the test Stripe key and missing reset flow are launch
blockers, not polish.

## G5 — Strengthen the Maker AI enterprise/B2B path

**Why:** The codebase already has a working, gated SSO bridge
(`GoToMakerAIAsync` in [MainLayout.razor](../../Layout/MainLayout.razor)) into
a companion "Maker AI" MES/ops platform for `IsMakerAIUser` accounts — this is
a real, differentiated growth lever (enterprise customers get an operational
platform, not just a storefront) that is currently invisible to anyone who
isn't already a recognized Maker AI user and already logged in.

**How to apply:** Lower priority than G1–G4 (it extends an already-working
path rather than fixing something broken), but worth a dedicated epic once the
core storefront is trustworthy — see [[E5.1]] in EPICS.md.

## G6 — Turn organic + paid search into qualified pond-demo leads

> Source: SEO/growth advisory review, 2026-09-03 — the technical-SEO half of that
> review (sitemap, robots.txt, prerendering, canonical URLs, hreflang,
> Organization/Product/Breadcrumb structured data, OpenGraph/Twitter tags) is
> already solid and is **not** re-scoped here. This goal covers only what the
> review flagged as missing. The account-level and field-work half of the same
> review lives in [OWNER_ACTIONS.md](OWNER_ACTIONS.md) under Vivian's name —
> several stories below are blocked on those actions and vice versa.

**Why:** The site is barely discoverable in search despite the strong technical
foundation — the review's `site:oxyniti.com` checks didn't reliably surface it.
The homepage leads with brand slogan ("Infinite Oxygen. Infinite Yield.")
instead of the buyer-intent language a farmer actually searches, there's no
low-friction lead offer (every path today asks a visitor to evaluate a capital
purchase), no case-study content exists to build topical authority, no
conversion tracking exists to measure the $1/day ad budget, and a
similarly-named Indian competitor ("Oxynity", note the spelling) competes for
the same searches.

**How to apply:** Sequence [[E6.1]]–[[E6.4]] (P0/P1, all pure engineering)
ahead of the paid-search launch in OWNER_ACTIONS.md — the ad campaign has
nothing to send traffic to or measure until the `/pond-demo` page and
conversion hooks exist. [[E6.5]]/[[E6.6]] depend on inputs only Vivian can
supply (real field data, native-language review) and should not block the
P0/P1 engineering work.
