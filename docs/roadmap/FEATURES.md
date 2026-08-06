# Oxyniti — Features

Each feature rolls up to an epic in [EPICS.md](EPICS.md) and breaks down into
stories in [STORIES.md](STORIES.md).

## Under E1.1 — Stub or ship every promised destination

- **F1.1.1 — Legal pages** (`/terms`, `/privacy`): static content pages,
  linked from the footer's existing "Legal" column.
- **F1.1.2 — Sitemap page** (`/sitemap`): simple generated list of all real
  routes, replacing the current dead footer link.
- **F1.1.3 — Fix the `/blog` vs `/blogs` route mismatch**: footer links to
  `/blog`, the actual page is `/blogs`.
- **F1.1.4 — Consistent "Coming Soon" fallback for any route not yet built**,
  reusing the existing `ComingSoon.razor` component so nothing 404s.

## Under E1.2 — Ship the missing Account page

- **F1.2.1 — `/account` page**: show the logged-in user's email, name, and a
  link to `/orders` and the address book already built for checkout
  (`AddressDetails`/`MakerClient.GetAddressAsync`) so users can manage saved
  addresses outside the checkout flow, not only during it.

## Under E2.1 — Wire up product search end to end

- **F2.1.1 — Fix `ExploreProductRange`'s broken two-way binding** so
  `Products.razor`'s search box actually calls `LoadProducts`/filters results
  (there is no dedicated search-results loader on `/products` today — it
  renders category browsing components only, not a product list, so this
  needs to either redirect into `/products/{FilterType}/{Slug}`-style search
  or add a results list to `/products` itself).
- **F2.1.2 — Build the `/search` results route** the header `SearchBox`
  already navigates to, backed by `MakerClient.ProductsBySlugAsync`'s
  existing `Search` parameter (already used by `ProductsByFilter.razor` —
  reuse that page's query pattern).

## Under E2.2 — Real order confirmation & post-purchase visibility

- **F2.2.1 — Read the Stripe `session_id` on `/checkout/return`** (Stripe
  already appends it per `StripeSettings.ReturnUrl` =
  `checkout/return?session_id={CHECKOUT_SESSION_ID}`) and show the resulting
  order summary instead of a static message.
- **F2.2.2 — Add "View your orders" / "Continue shopping" CTAs** to the
  return page, linking to `/orders` and `/products`.
- **F2.2.3 — Distinct treatment for terminal/exception order states**:
  `Orders.razor`'s status tracker (`Ordered → Processing → Shipped → Out For
  Delivery → Delivered`) has no step for `Cancelled`/`Refunded`/`Failed` —
  today any status outside the five known ones silently renders as step 0
  ("Ordered"), which misrepresents a cancelled or failed order as freshly
  placed.
- **F2.2.4 — Shareable single-order status view**: a direct route (e.g.
  `/orders/{orderBarId}`) showing one order's tracker and items, so
  `checkout/return` (F2.2.1/F2.2.2) and order-notification emails can deep
  link straight to "your" order instead of only ever landing on the full
  `/orders` list.
- **F2.2.5 — Filter the orders list by status**: `/orders` paginates but has
  no way to narrow to e.g. just "Shipped" or "Processing" orders, which
  matters once a customer has more than a page or two of order history.
- **F2.2.6 — Order tracking detail** (carrier, tracking number, ETA):
  `Orders.razor` already renders a status stepper (Ordered / Processing /
  Shipped / Out For Delivery / Delivered) driven by `order.Status`, but shows
  no carrier, tracking number, or estimated delivery date — no such field
  exists on `OrderDetail`/`IMakerClient` today, so scope starts with a
  backend-shape check.

## Under E2.3 — Password recovery flow

- **F2.3.1 — Forgot-password request page**: replace `Login.razor`'s
  `href="#"` with a real route that collects an email and calls into
  whatever reset endpoint `IMakerClient`/the RampEdge backend exposes (or
  flags the backend gap if none exists yet — verify against `IMakerClient`
  before committing to scope).
- **F2.3.2 — Reset-password email with a secure token link**: the backend
  call triggered by F2.3.1 sends an email containing a time-limited reset
  link (`/reset-password?token=...`); no email-sending or token-issuing path
  exists anywhere in the codebase today, so this is the piece that actually
  gets the recovery email into the user's inbox.
- **F2.3.3 — Reset-password confirmation page**: new
  `Pages/ResetPassword.razor` that reads the `token` query parameter,
  validates it against the backend, and lets the user set a new password —
  the other half of the flow F2.3.1 only starts.
- **F2.3.4 — Resend & rate-limit handling for recovery requests**: cooldown
  on repeat "Forgot Password?" submissions plus a "Resend email" affordance
  on the confirmation screen, so the flow degrades gracefully under abuse or
  a lost email.

## Under E3.1 — Support & policy content hub

- **F3.1.1 — FAQs page** (`/faqs`).
- **F3.1.2 — Installation Guides page** (`/installation-guides`) — relevant
  given these are physical industrial systems (nanobubble generators) that
  need on-site setup guidance.
- **F3.1.3 — Warranty & Returns page** (`/warranty`).
- **F3.1.4 — Shipping Info page** (`/shipping`) — lead times matter more for
  capital equipment than for typical retail.

## Under E3.2 — Custom quote request flow

- **F3.2.1 — `/quote` request form**: name, company, application (aquaculture
  / wastewater / hydroponics — matches the three use-cases already named on
  `/about`), scale/volume, and message — distinct from the Contact form
  because it's a qualified sales lead, not general contact.

## Under E3.3 — Wire the Contact form to a real destination

- **F3.3.1 — Replace the `Console.WriteLine` TODO in `Contact.razor`** with a
  real submission path (email notification, CRM webhook, or a RampEdge
  backend endpoint if one exists — check `IMakerClient` first rather than
  assuming a new backend endpoint is needed).
- **F3.3.2 — Submission confirmation UI**: currently the form silently resets
  with no success/failure feedback to the user at all.

## Under E4.1 — Brand consistency pass

- **F4.1.1 — Decide the single brand narrative** (Oxyniti product line vs.
  Revaron as manufacturer — likely "Revaron manufactures the Oxyniti product
  line," but confirm with the business owner rather than guessing) and apply
  it consistently to `index.html` `<title>`, Home `PageTitle`, and the About
  page copy.

## Under E4.2 — SEO & metadata foundation

- **F4.2.1 — Add `<PageTitle>` to every route** currently missing one
  (Products, Cart, Checkout, Orders, About, Contact, Login, Register, Services
  detail pages).
- **F4.2.2 — Add a meta description + Open Graph tags to `index.html`** (none
  exist today beyond charset/viewport/title).

## Under E4.3 — Go-live readiness checklist

- **F4.3.1 — Move Stripe to a live publishable key behind environment-specific
  config** (`appsettings.json` vs `appsettings.Development.json` — confirm the
  live key is only ever injected in the production deploy config, never
  committed alongside the test key).
- **F4.3.2 — Remove or wire up the unused `icon-192.png`** (no
  `manifest.json` references it today — either add a proper web-app manifest
  or drop the asset).

## Under E5.1 — Surface the Maker AI SSO path earlier in the funnel

- **F5.1.1 — "Enterprise / MES customers" entry point**: a discoverable CTA
  (on `/about` or a new `/enterprise` page) explaining the Maker AI
  integration, distinct from the current logged-in-only dropdown entry in
  `MainLayout.razor`.
