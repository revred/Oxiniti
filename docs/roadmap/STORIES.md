# Oxyniti — User Stories

Each story rolls up to a feature in [FEATURES.md](FEATURES.md). Sizes are
rough (S = a few hours, M = ~1 day, L = multi-day / needs a backend
conversation first). "Touches" lists the concrete files to start from.

---

## E1.1 — Dead links / stub routes

### S-1.1.1 — Legal pages exist and render (P0, S)
**As** a buyer researching Oxyniti before purchase, **I want** the footer's
"Terms & Conditions" and "Privacy Policy" links to open real pages, **so that**
I can evaluate the vendor without hitting a dead link.
- Touches: new `Pages/Terms.razor` (`/terms`), `Pages/Privacy.razor`
  (`/privacy`).
- Acceptance:
  - [ ] `/terms` and `/privacy` render real (even if placeholder-drafted)
        content with a proper `<PageTitle>`.
  - [ ] Footer links point at these routes and no longer 404.

### S-1.1.2 — Sitemap page (P0, S)
**As** a visitor, **I want** a sitemap listing every real page, **so that** I
can navigate directly instead of guessing URLs.
- Touches: new `Pages/Sitemap.razor` (`/sitemap`).
- Acceptance:
  - [ ] Lists every route that currently exists in `Pages/`.
  - [ ] Updated whenever a new top-level page ships (call this out in the PR
        checklist for future page additions).

### S-1.1.3 — Fix `/blog` → `/blogs` footer mismatch (P0, XS)
**As** a visitor clicking "Blog" in the footer, **I want** it to go to the
page that actually exists, **so that** I don't hit a dead route.
- Touches: `Pages/Components/Footer.razor` line linking `/blog`.
- Acceptance:
  - [ ] Footer "Blog" link points to `/blogs` (or the route is renamed to
        `/blog` for consistency — pick one, but they must match).

### S-1.1.4 — Consistent stub for not-yet-built pages (P0, S)
**As** a visitor clicking a footer/nav link that isn't built yet, **I want**
a clear "Coming Soon" message instead of a browser 404, **so that** the site
still feels intentional and complete.
- Touches: reuse `Pages/Inputs/ComingSoon.razor`; add thin page wrappers for
  `/faqs`, `/installation-guides`, `/warranty`, `/shipping`, `/quote` until
  their real content ships (S-3.1.x / S-3.2.1).
- Acceptance:
  - [ ] None of the nine currently-dead footer/nav routes return Blazor's
        default 404 — each renders either real content or the `ComingSoon`
        component.

---

## E1.2 — Missing Account page

### S-1.2.1 — `/account` page shows profile + saved addresses (P0, M)
**As** a logged-in customer, **I want** an Account page reachable from the
user menu, **so that** the "Account" link in `MainLayout.razor`'s dropdown
stops being dead.
- Touches: new `Pages/Account.razor` (`/account`); reuse
  `MakerClient.GetAddressAsync`/`UpsertAddressAsync` already built for
  `Checkout.razor`.
- Acceptance:
  - [ ] Shows the authenticated user's email (from the JWT, same pattern as
        `Checkout.razor.GetEmailFromAccessToken`).
  - [ ] Lists saved addresses with edit capability (can share the
        `AddressEditorVm` pattern from `Checkout.razor`).
  - [ ] Links to `/orders`.
  - [ ] Unauthenticated visitors hitting `/account` directly are redirected
        to `/login`.

---

## E2.1 — Search is fully wired

### S-2.1.1 — Fix `ExploreProductRange`'s broken binding (P0, S)
**As** a user typing in the search box on `/products`, **I want** my input to
actually reach the page's search logic, **so that** the search box isn't
decorative.
- Touches: `Pages/Components/ExploreProductRange.razor` — the inner
  `<input @bind-Value="SearchTerm">` binds directly to the `[Parameter]`
  instead of the `SearchTermBacking` property that raises
  `SearchTermChanged`; fix the binding target so keystrokes actually
  propagate up through `Products.razor`'s `@bind-SearchTerm`.
- Acceptance:
  - [ ] Typing in the `/products` search box triggers a product query (reuse
        the existing debounce pattern already implemented correctly in
        `ProductsByFilter.razor.HandleSearchInput`).
  - [ ] `/products` actually renders a filtered product list — today it only
        renders category-browsing components (`DiscoverProductTypes`,
        `HelpBanner`, `InfoCards`), so this story includes adding a results
        list, not just fixing the binding.

### S-2.1.2 — Build the `/search` results route (P0, M)
**As** a user pressing Enter in the header search box, **I want** to land on
a real results page, **so that** `SearchBox.razor`'s existing navigation to
`/search?q=...` stops 404ing.
- Touches: new `Pages/Search.razor` (`/search`), reusing
  `MakerClient.ProductsBySlugAsync`'s `Search` parameter and the list-rendering
  pattern already built in `ProductsByFilter.razor`.
- Acceptance:
  - [ ] `/search?q=<term>` renders matching products using the existing
        `ProductRequest.Search` backend parameter.
  - [ ] Empty results show a clear "No products found for '<term>'" message
        (pattern already exists in `Cart.razor`/`ProductsByFilter.razor`).

---

## E2.2 — Real order confirmation

### S-2.2.1 — Read Stripe `session_id` and show a real confirmation (P1, M)
**As** a customer who just paid, **I want** to see confirmation of what I
bought and for how much, **so that** I have proof my order went through.
- Touches: `Pages/CheckoutReturn.razor` — currently a static "Thank You!"
  with no code-behind; add `[SupplyParameterFromQuery] session_id`, verify
  against the backend (check `IMakerClient` for an existing
  order-by-session-id lookup before assuming new backend work is needed).
- Acceptance:
  - [ ] Page reads `session_id` from the query string
        (`StripeSettings.ReturnUrl` already appends
        `?session_id={CHECKOUT_SESSION_ID}`).
  - [ ] Shows order number/items if the backend can resolve them from the
        session id; degrades gracefully to the current generic message if not
        yet supported server-side.

### S-2.2.2 — "View orders" / "Continue shopping" CTAs on the return page (P1, XS)
**As** a customer on the order-confirmation page, **I want** clear next
steps, **so that** I'm not stranded on a dead-end page.
- Touches: `Pages/CheckoutReturn.razor`.
- Acceptance:
  - [ ] Buttons linking to `/orders` and `/products` are present and styled
        consistently with the rest of the site (`btn-gradient`/`btn-primary`
        classes already used elsewhere).

### S-2.2.3 — Cancelled/refunded/failed orders don't render as "just placed"
**As** a customer with a cancelled or failed order, **I want** the status
tracker to say so, **so that** I don't think it's still being processed.
- Touches: `Pages/Orders.razor` `currentStep` computation (lines ~90-97),
  currently `s == "ProjectCreated" || s == "Processing" ? 1 : 0` — any other
  status value falls through to step 0 ("Ordered") with no visual
  distinction from a brand-new order.
- Acceptance:
  - [ ] `Cancelled`, `Refunded`, and `Failed` (or whatever the backend's
        actual terminal-status strings are — confirm against `OrderDetail`)
        each render a distinct, clearly-labelled state instead of falling
        back to step 0.
  - [ ] The five-step progress tracker doesn't imply forward progress for a
        cancelled/failed order (e.g. it's replaced by a status badge, not
        left mid-tracker).

### S-2.2.4 — Direct link to a single order's status
**As** a customer who just checked out (or clicked a link from an order
email), **I want** to land on that specific order's status, **so that** I'm
not stuck scanning the whole order history to find it.
- Touches: new route in `Pages/Orders.razor` or a new `Pages/OrderStatus.razor`
  (e.g. `/orders/{orderBarId}`); wire from `CheckoutReturn.razor`'s
  "View your orders" CTA (S-2.2.2) when the resolved order id is known.
- Acceptance:
  - [ ] `/orders/{orderBarId}` shows that order's tracker + items,
        pre-expanded, without requiring the user to page through `/orders`.
  - [ ] Unknown/foreign `orderBarId` (not owned by the logged-in user) shows
        a clear not-found state, not another user's order.

### S-2.2.5 — Filter the orders list by status
**As** a returning customer with many past orders, **I want** to filter
`/orders` by status, **so that** I can quickly find e.g. everything still
"Processing" without paging through delivered orders.
- Touches: `Pages/Orders.razor` (`LoadOrders`/`OrderRequest`) — confirm
  whether `OrderRequest` already supports a status filter server-side before
  scoping as backend + frontend vs. frontend-only.
- Acceptance:
  - [ ] A status filter (dropdown or pill row) narrows the list to matching
        orders and resets to page 1.
  - [ ] "All" clears the filter back to the current unfiltered behavior.
  - [ ] Filter selection persists across pagination within the same visit.

### S-2.2.6 — Order tracking detail shows carrier + tracking number or ETA fallback (P1, M — depends on backend)
**As** a customer waiting on a shipment, **I want** to see the carrier,
tracking number, and estimated delivery date on my order, **so that** I know
where my order actually is instead of just a generic status label.
- Touches: `Pages/Orders.razor` (existing stepper at line ~90-127),
  `IMakerClient`/`OrderDetail` — no tracking fields exist yet, confirm
  backend shape before scoping as frontend-only.
- Acceptance:
  - [ ] First: confirm whether the RampEdge backend can supply
        carrier/tracking-number/ETA per order — this story's size depends on
        that (M if the data exists and just needs surfacing, L if backend
        work is required first).
  - [ ] Orders at `Shipped` or later show carrier name + tracking number,
        linked to the carrier's tracking URL when the carrier is known.
  - [ ] Orders without tracking data yet show an estimated-delivery-date
        range instead of a blank/dead field.

---

## E2.3 — Password recovery

### S-2.3.1 — Forgot-password request page (P1, L — depends on backend)
**As** a user who forgot their password, **I want** a working "Forgot
Password?" link, **so that** I can regain access without contacting support.
- Touches: `Pages/Login.razor` (`href="#"` → real route), new
  `Pages/ForgotPassword.razor`.
- Acceptance:
  - [ ] First: confirm whether `IMakerClient`/the RampEdge backend already
        exposes a password-reset endpoint — this story's size depends
        entirely on that (S if it exists and just needs wiring, L if backend
        work is required first).
  - [ ] "Forgot Password?" navigates to a real form collecting an email.
  - [ ] User receives a clear success/failure message, matching the
        existing `error-message`/`success-message` pattern in
        `Login.razor`/`Register.razor`.

### S-2.3.2 — Reset-password email delivers a working token link
**As** a user who just submitted the forgot-password form, **I want** an
email with a link that takes me straight to a reset form, **so that** I can
regain access without support intervention.
- Touches: backend/API call triggered from `Pages/ForgotPassword.razor`
  (S-2.3.1); no existing email-sending or token-issuing code — confirm
  against `IMakerClient`/RampEdge backend before scoping as frontend-only.
- Acceptance:
  - [ ] Submitting a known email sends a message containing a link to
        `/reset-password?token=...`.
  - [ ] The token expires after a bounded window (e.g. 1 hour) and is
        single-use.
  - [ ] Submitting an unknown email does not reveal whether the address is
        registered (generic success message either way).

### S-2.3.3 — Reset-password confirmation page sets a new password
**As** a user who clicked the reset link from my email, **I want** a page
that lets me set a new password, **so that** I can log back in immediately.
- Touches: new `Pages/ResetPassword.razor` (`/reset-password?token=...`).
- Acceptance:
  - [ ] Valid, unexpired token shows a new-password form (with confirm
        field) and, on submit, updates the password and redirects to
        `/login` with a success message.
  - [ ] Expired or already-used token shows a clear error with a link back
        to the forgot-password form instead of a broken/blank page.
  - [ ] Password field enforces the same validation rules as `Register.razor`.

### S-2.3.4 — Resend & rate-limit forgot-password requests
**As** a user who mistyped their email or didn't receive the reset message,
**I want** to resend the recovery email without being blocked, **but** not
be able to spam the endpoint, **so that** the flow is both usable and abuse
resistant.
- Touches: `Pages/ForgotPassword.razor`, `Pages/ResetPassword.razor` (resend
  affordance), backend rate-limit on the reset-request endpoint.
- Acceptance:
  - [ ] A visible cooldown (e.g. 60s) prevents rapid repeat submissions from
        the same form.
  - [ ] "Resend email" on the post-submit screen re-triggers S-2.3.2 without
        requiring the user to retype their email.

---

## E2.4 — Cart quantity editing

### S-2.4.1 — Change item quantity from the cart page (P1, S)
**As** a shopper reviewing my cart, **I want** to change how many of an item
I'm buying right there, **so that** I don't have to remove it and re-add it
from the product page just to adjust quantity.
- Touches: `Pages/Cart.razor` (replace the plain `Quantity: @p.Quantity` text
  at line ~66 with +/- stepper controls); `Services/CartService.cs` —
  `AddToCartCore` already sets `existing.Quantity` for a known slug, so this
  needs a thin slug-based update method (or reuse of the existing
  `AddToCart` overloads) rather than a new backend endpoint.
- Acceptance:
  - [ ] Each cart line has +/- controls (and/or a direct quantity input)
        that update the line's quantity without a full page reload.
  - [ ] Quantity changes persist the same way `AddToCart`/`RemoveFromCart`
        already do (guest local cart vs. authenticated server cart via
        `PersistCart`).
  - [ ] Decrementing to 0 behaves the same as "Remove" (with the same
        confirmation, if any, as the existing Remove button).
  - [ ] Quantity cannot go below 1 via the stepper (0 removes via the
        explicit path above, not by decrementing past 1).

---

## E3.1 — Support & policy content hub

### S-3.1.1 — FAQs page (P1, M)
**As** a prospective buyer, **I want** answers to common questions about
nanobubble generators, **so that** I don't need to email support for basics.
- Touches: new `Pages/Faqs.razor` (`/faqs`).
- Acceptance:
  - [ ] Real Q&A content (source from the business owner — don't fabricate
        technical claims about the equipment).
  - [ ] Footer "FAQs" link no longer dead.

### S-3.1.2 — Installation Guides page (P1, M)
**As** a customer who purchased a nanobubble system, **I want** installation
guidance, **so that** I can set it up correctly.
- Touches: new `Pages/InstallationGuides.razor` (`/installation-guides`).
- Acceptance:
  - [ ] Content sourced from the business owner (real specs/steps, not
        invented).
  - [ ] Linked from the footer and, ideally, from `/orders`/`/account` for
        customers who've already purchased.

### S-3.1.3 — Warranty & Returns page (P1, S)
**As** a buyer, **I want** to know the warranty and return terms before I
buy, **so that** I can assess risk on a capital purchase.
- Touches: new `Pages/Warranty.razor` (`/warranty`).
- Acceptance:
  - [ ] Real terms sourced from the business owner.
  - [ ] Footer link no longer dead.

### S-3.1.4 — Shipping Info page (P1, S)
**As** a buyer, **I want** shipping/lead-time expectations, **so that** I can
plan around delivery for industrial equipment.
- Touches: new `Pages/Shipping.razor` (`/shipping`).
- Acceptance:
  - [ ] Real lead-time/shipping-region content sourced from the business
        owner.
  - [ ] Footer link no longer dead.

---

## E3.2 — Custom quote request

### S-3.2.1 — `/quote` request form (P1, M)
**As** a large-scale buyer (e.g. a wastewater treatment operator), **I want**
to request a custom quote instead of self-serve checkout, **so that** I can
get pricing suited to my scale.
- Touches: new `Pages/Quote.razor` (`/quote`).
- Acceptance:
  - [ ] Form captures name, company, application (aquaculture / wastewater /
        hydroponics, matching `/about`'s existing use-case language),
        scale/volume, and message.
  - [ ] Submits to a real destination (share the wiring from S-3.3.1 rather
        than building a second, separate lead pipe).
  - [ ] Footer "Request a Custom Quote" link no longer dead.

---

## E3.3 — Contact form actually submits

### S-3.3.1 — Wire `Contact.razor` to a real submission path (P0, M)
**As** a visitor filling out the contact form, **I want** my message to
actually reach the business, **so that** it isn't silently discarded.
- Touches: `Pages/Contact.razor` — replace the
  `// TODO: wire up email or API call` / `Console.WriteLine` in
  `HandleValidSubmit`.
- Acceptance:
  - [ ] First: check `IMakerClient` for an existing contact/lead-submission
        endpoint before assuming a new backend integration is required.
  - [ ] Submitting a valid form actually delivers the message (email
        notification, CRM webhook, or backend endpoint — whichever the
        RampEdge backend supports).
  - [ ] User sees success or failure feedback (currently the form just
        silently resets with no signal either way — see S-3.3.2).

### S-3.3.2 — Submission confirmation UI (P0, XS)
**As** a visitor who submitted the contact form, **I want** to see
confirmation it was sent, **so that** I'm not left wondering if it worked.
- Touches: `Pages/Contact.razor`.
- Acceptance:
  - [ ] Success message shown on successful submit (pattern already exists:
        `success-message`/`error-message` classes used in
        `Login.razor`/`Register.razor`).
  - [ ] Error message shown on failure, with the form data preserved so the
        user doesn't have to retype it.

---

## E4.1 — Brand consistency

### S-4.1.1 — Reconcile "Oxyniti" vs "Revaron" branding (P1, S — needs a business decision first)
**As** a visitor reading the About page right after seeing "Oxyniti - Natural
Innovation" in the browser tab, **I want** the brand story to be internally
consistent, **so that** I'm not confused about who I'm buying from.
- Touches: `index.html` `<title>`, `Pages/Home.razor`'s `PageTitle`,
  `Pages/About.razor` copy.
- Acceptance:
  - [ ] Confirm with the business owner whether "Revaron" is the
        manufacturer and "Oxyniti" the product line (most likely reading) or
        something else — **do not silently rewrite the About copy without
        that confirmation**, since it currently contains real factual claims
        (100+ installations across India) that shouldn't be altered without
        sign-off.
  - [ ] Once confirmed, apply the resolved brand story consistently across
        `index.html`, Home, and About.

---

## E4.2 — SEO & metadata

### S-4.2.1 — `<PageTitle>` on every route (P2, S)
**As a search engine / a user with many tabs open**, **I want** every page to
have a distinct, descriptive title, **so that** pages are identifiable and
indexable.
- Touches: `Pages/Products.razor`, `Cart.razor`, `Checkout.razor`,
  `Orders.razor`, `About.razor`, `Contact.razor`, `Login.razor`,
  `Register.razor`, `Services.razor` — none currently set `<PageTitle>`
  (only `Home.razor` and `ProductDetails.razor` do today).
- Acceptance:
  - [ ] Every page above renders a distinct `<PageTitle>`.

### S-4.2.2 — Meta description + Open Graph tags (P2, S)
**As** someone sharing an Oxyniti link on social/chat, **I want** a proper
preview card, **so that** the link doesn't look broken/blank when shared.
- Touches: `wwwroot/index.html` `<head>`.
- Acceptance:
  - [ ] `<meta name="description">` added with real content.
  - [ ] Basic Open Graph tags (`og:title`, `og:description`, `og:image` using
        `oxyniti.png`) added.

---

## E4.3 — Go-live readiness

### S-4.3.1 — Live Stripe key behind environment config (P0 before real launch, M)
**As** the business, **I want** production payments to actually work, **so
that** the storefront can take real orders.
- Touches: `wwwroot/appsettings.json` currently ships
  `Stripe.PublicKey = pk_test_...`.
- Acceptance:
  - [ ] Confirm with the business owner that go-live is actually intended
        before flipping this — this is a real launch decision, not a
        mechanical fix.
  - [ ] Live key is injected via environment-specific deploy config, never
        committed to source alongside the test key.
  - [ ] `StripeSettings.ReturnUrl` verified against the production base
        address.

### S-4.3.2 — Clean up unused PWA icon asset (P2, XS)
**As** a maintainer, **I want** `wwwroot/icon-192.png` to either be used or
removed, **so that** the repo doesn't carry a dead asset implying PWA support
that doesn't exist.
- Touches: `wwwroot/icon-192.png`, no `manifest.json` currently references
  it.
- Acceptance:
  - [ ] Either add a proper `manifest.json` (if PWA installability is
        wanted) or remove the unused asset.

---

## E5.1 — Maker AI enterprise entry point

### S-5.1.1 — Discoverable "Enterprise / MES customers" page (P2, M)
**As** a prospective enterprise/MES customer, **I want** to learn about the
Maker AI integration before I'm already a recognized account, **so that** I
can evaluate it as part of my purchase decision.
- Touches: new `Pages/Enterprise.razor` or an added section on
  `Pages/About.razor`; the existing SSO mechanics in
  `Layout/MainLayout.razor.GoToMakerAIAsync` stay as-is (already working,
  just currently only reachable post-login for `IsMakerAIUser` accounts).
- Acceptance:
  - [ ] A logged-out or non-Maker-AI visitor can find and read about the
        Maker AI integration path.
  - [ ] Existing gated SSO behavior for recognized `IsMakerAIUser` accounts
        is unchanged.

---

## E6.1 — Homepage & entity SEO rewrite

### S-6.1.1 — Homepage title/H1/subhead rewritten for buyer intent (P0, XS)
**As** a farmer searching "nano bubble generator for fish farming", **I
want** the homepage to speak that language, **so that** I recognize this as
the site I was looking for.
- Touches: `Pages/Home.razor` `PageTitle`/H1, `wwwroot/index.html` `<title>`.
- Acceptance:
  - [ ] `<title>`/`PageTitle` reads
        `Nano Bubble Generator for Fish Farming & Aquaculture | Oxyniti`.
  - [ ] H1 reads `Nano-Bubble Aeration for Fish Ponds`, with "Infinite
        Oxygen. Infinite Yield." kept as a subhead beneath it, not removed.
  - [ ] Vivian has approved the copy before merge (brand-voice call, not a
        mechanical fix — see OWNER_ACTIONS.md item 3).

### S-6.1.2 — Entity descriptor added across metadata (P1, XS)
**As** someone searching for Oxyniti, **I want** search results to clearly
distinguish it from the similarly-named "Oxynity", **so that** I land on the
right company.
- Touches: `wwwroot/index.html` meta description, Organization schema
  `description` field, homepage subhead (shares S-6.1.1's copy slot).
- Acceptance:
  - [ ] "Nano-Bubble Aeration Systems for Aquaculture" (or equivalent)
        appears alongside the bare "Oxyniti" name in `<title>`/meta
        description/Organization schema — not relying on the brand name
        alone anywhere it matters for search.

---

## E6.2 — `/pond-demo` lead-capture funnel

### S-6.2.1 — `/pond-demo` page exists with a lead form (P0, M)
**As** a farmer who clicked a paid-search ad, **I want** a simple page
offering a free pond test, **so that** I can request one without committing
to a purchase.
- Touches: new `Pages/PondDemo.razor` (`/pond-demo`).
- Acceptance:
  - [ ] Headline reads "Free Pond Oxygen Test + System Sizing" (or approved
        equivalent).
  - [ ] Form captures name, phone/WhatsApp, village/location, pond
        dimensions, species, stocking density, existing aeration, current
        problem.
  - [ ] Page has its own `PageTitle`/meta description distinct from the
        homepage.

### S-6.2.2 — Form submits to a real destination, not a console log (P0, S — depends on E3.3)
**As** a farmer submitting the pond-demo form, **I want** my request to
actually reach Oxyniti, **so that** it isn't silently discarded the way
`Contact.razor`'s submissions are today.
- Touches: `Pages/PondDemo.razor` — share S-3.3.1's fixed submission path
  once it ships; if E3.3 hasn't landed yet, wire this form to a real
  destination independently rather than waiting.
- Acceptance:
  - [ ] Submitting the form delivers the lead somewhere real (email/CRM/
        backend endpoint — whichever E3.3 resolves to).
  - [ ] Visible success/failure feedback, matching the
        `success-message`/`error-message` pattern used in `Login.razor`.
  - [ ] **This story does not ship with a placeholder/console-only handler
        under any circumstances** — that exact bug already exists once in
        this codebase (S-3.3.1) and must not be repeated.

### S-6.2.3 — WhatsApp/call CTAs are present and click-trackable (P0, S — depends on E6.4)
**As** a farmer who'd rather message than fill a form, **I want** direct
WhatsApp/call buttons on `/pond-demo`, **so that** I can reach Oxyniti the
way I prefer.
- Touches: `Pages/PondDemo.razor`; event hooks from F6.4.1.
- Acceptance:
  - [ ] WhatsApp deep link and tel: link both present and functional.
  - [ ] Each click fires the GA4 event from S-6.4.1 (or a documented
        placeholder event name if S-6.4.1 hasn't landed yet).

---

## E6.3 — Structured-data enrichment

### S-6.3.1 — Product/Offer schema carries Merchant-Center-ready fields (P1, S)
**As** Google Merchant Center evaluating Oxyniti's feed, **I want**
complete Offer data, **so that** the products are eligible for free
listings.
- Touches: wherever Product/Offer JSON-LD is currently emitted (per the
  advisory, product pages already have basic Product/Offer schema — locate
  and extend it rather than adding a second schema block).
- Acceptance:
  - [ ] `availability`, shipping details, and return policy are present on
        every product's Offer schema.
  - [ ] SKU/MPN added only where a genuine value exists — never invented.

### S-6.3.2 — Organization schema carries real entity data (P1, S — blocked on data from Vivian)
**As** Google trying to disambiguate Oxyniti from "Oxynity", **I want**
concrete entity signals, **so that** search correctly attributes results to
the right company.
- Touches: existing Organization/LocalBusiness JSON-LD block.
- Acceptance:
  - [ ] `legalName`, `address`, `email`, `sameAs` populated with real values
        supplied by Vivian (OWNER_ACTIONS.md item 6) — **do not fabricate
        any of these fields**; if a value doesn't exist yet, omit the
        property rather than inventing one.

---

## E6.4 — Conversion-tracking scaffolding

### S-6.4.1 — GA4 events fire for the four key actions (P1, S)
**As** whoever is running the $1/day Ads campaign, **I want** pond-demo
submits, WhatsApp clicks, call clicks, and product enquiries tracked, **so
that** cost-per-qualified-pond is measurable at all.
- Touches: `wwwroot/index.html` (gtag.js include), new small JS/C# event-
  firing helper called from `Pages/PondDemo.razor`, `Pages/Contact.razor`,
  product enquiry paths.
- Acceptance:
  - [ ] Four named events fire on the four actions above.
  - [ ] GA4 Measurement ID is read from config, not hardcoded — real ID
        supplied by Vivian once a GA4 property exists (OWNER_ACTIONS.md);
        code works with a placeholder/env-gated ID until then.

### S-6.4.2 — Ads conversion events wired once IDs exist (P2, XS — blocked on Vivian's Ads account)
**As** the Ads campaign, **I want** the same four actions counted as
conversions, **so that** Google can optimize toward qualified leads.
- Touches: same event-firing helper as S-6.4.1, extended with an Ads
  conversion-ID call alongside the GA4 event.
- Acceptance:
  - [ ] Each event also fires an Ads conversion call once Vivian supplies
        real conversion action IDs.
  - [ ] No placeholder Ads conversion ID is ever merged as if it were real.

---

## E6.5 — Case-study page template

### S-6.5.1 — Case-study page template renders from structured data (P1, M)
**As** a farmer researching whether Oxyniti works for ponds like mine, **I
want** to read real field results, **so that** I trust the product before
requesting a demo.
- Touches: new `Pages/CaseStudy.razor` (or similar) taking a data record
  with the fields listed in F6.5.1; no real content yet — this story is the
  template only.
- Acceptance:
  - [ ] Renders pond area/depth, water volume, species, stocking density, DO
        before/after at 15/30/60 min, equipment model, power consumption,
        farmer comment, photo(s), and an optional video embed.
  - [ ] Works with a single placeholder/sample record for review before any
        real case study is entered.

### S-6.5.2 — Case-study index replaces the `/blogs` stub (P1, S — depends on ≥1 real case study)
**As** a visitor, **I want** a list of Oxyniti's real field results, **so
that** I can browse proof points instead of hitting the current "Coming
Soon" stub.
- Touches: `/blogs` route (currently `ComingSoon.razor` per E1.1).
- Acceptance:
  - [ ] `/blogs` lists real case studies once at least one exists (do not
        ship this story with zero real entries — leave the `ComingSoon`
        stub in place until then).

---

## E6.6 — Localise the money pages

### S-6.6.1 — Tamil draft of the six money pages, flagged unreviewed (P2, M)
**As** a Tamil-speaking farmer, **I want** a Tamil sales page, not just a
translated nav shell, **so that** I can actually evaluate the product in my
language.
- Touches: existing localized-route infrastructure; homepage,
  `/aquaculture-oxygenation`, `/products`, product pages, `/pond-demo`, 2–3
  case studies.
- Acceptance:
  - [ ] All six page types have a Tamil draft in the existing localization
        system.
  - [ ] Draft is clearly marked unreviewed/pending native-speaker sign-off
        (OWNER_ACTIONS.md item 7) and **not linked from primary navigation
        until reviewed**.

### S-6.6.2 — Telugu draft, same page set (P2, M — sequenced after Tamil)
**As** a Telugu-speaking farmer, **I want** the same real sales pages in
Telugu, **so that** I get the same experience Tamil speakers do.
- Touches: same page set as S-6.6.1.
- Acceptance:
  - [ ] Starts only after S-6.6.1 ships and Vivian confirms geography
        warrants it (per the advisory's rollout order).
  - [ ] Same unreviewed-until-signed-off treatment as S-6.6.1.
