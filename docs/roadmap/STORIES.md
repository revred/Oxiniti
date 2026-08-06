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
