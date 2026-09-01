# Image & video provenance inventory

Audit requested by [#79](https://github.com/revred/Oxiniti/issues/79), following
the synthetic-images-as-trial-photography finding in
[#78](https://github.com/revred/Oxiniti/issues/78).

Every image/video shipped under `wwwroot/images/` and `wwwroot/videos/` is
listed below with: where it is used, what the surrounding copy claims about
it (if anything), and its source as best determined by direct inspection
(camera footage vs. rendered graphic vs. AI-generated/composited) plus repo
history where available. "Claim" means the surrounding copy asserts the
asset is real footage, a real installation, or trial evidence, as opposed to
a labelled render or a plain decorative/UI image that makes no such claim.

## Homepage marketing assets

| Asset | Used in | Claim made by surrounding copy | Source | Status |
|---|---|---|---|---|
| `hero-poster-wide.avif` / `.jpg` | `Hero.razor` (video poster), `wwwroot/index.html` (shell + og:image), `Home.razor` JSON-LD `thumbnailUrl` | "Infinite Oxygen. Infinite Yield." — implicit real-product claim via hero video | Real photo/video frame — visibly a genuine pond scene (net enclosure, staked poles, natural imperfections), consistent with `hero.mp4` | OK |
| `hero-poster.avif` / `.jpg` (non-`-wide`) | Not referenced anywhere in current code | none | Unknown (unused) | **Orphaned** — safe to delete or confirm intentionally kept for a future crop |
| `drone-poster.jpg` | `SkyViewSection.razor` (video poster), `Home.razor` JSON-LD `thumbnailUrl` | "Real footage from a live Oxyniti trial." / `DRONE · LIVE TRIAL` badge | Real aerial/drone footage frame — two people, a boat, tanks and hoses in a natural pond setting, consistent with `drone.mp4` | OK |
| `plume-poster.jpg` | `FieldFootageSection.razor` (video poster) | "The nano-plume — oxygen dissolving in real time" | Real footage frame — same net-enclosure scene as the hero shot, visible turbulence from the diffuser | OK |
| `oxy-nano-poster.webp` | `OxyNanoVideoSection.razor` (video poster), `Home.razor` JSON-LD | "See the OXY-Nano Series in action" — product overview, not a trial/authenticity claim | Produced graphic/slide (spec comparison card), not a photograph | OK — it is an explainer graphic and is not presented as photography |
| `unit-pondside@2x.{avif,jpg,webp}` / `unit-pondside.{avif,jpg,webp}` | Formerly `FieldFootageSection.razor` and `wwwroot/index.html` og:image/twitter:image | Was captioned "On-site install — pond edge, ready to run" / alt "installed at a fish pond" | **AI-generated/composited** — confirmed by direct visual inspection: identical unit cluster, hose routing, hardware placement and distorted logo/panel-label artifacts as `unit-fishfarm@2x`, on a different backdrop | **Fixed** — removed from `FieldFootageSection.razor` (#78 interim fix) and from `index.html` og:image (this PR). No longer referenced anywhere. File retained on disk, unused. |
| `unit-fishfarm@2x.{avif,jpg,webp}` / `unit-fishfarm.{avif,jpg,webp}` | Formerly `FieldFootageSection.razor` | Was captioned "Family Fish Farm — live trial in progress" | **AI-generated/composited** — same unit pair as `unit-pondside@2x`, see above | **Fixed** — removed from `FieldFootageSection.razor` (#78 interim fix). No longer referenced anywhere. File retained on disk, unused. |

## Video files

| Asset | Used in | Claim made by surrounding copy | Source | Status |
|---|---|---|---|---|
| `hero.webm` / `hero.mp4` | `Hero.razor` | Implicit real-product claim (hero background loop) | Real footage (matches `hero-poster-wide.jpg`) | OK |
| `drone.webm` / `drone.mp4` | `SkyViewSection.razor` | "Real footage from a live Oxyniti trial" | Real aerial footage (matches `drone-poster.jpg`) | OK |
| `plume-portrait.webm` / `plume-portrait.mp4` | `FieldFootageSection.razor` | "The nano-plume — oxygen dissolving in real time" | Real footage (matches `plume-poster.jpg`); explicitly called out in #78 as reading genuine | OK |
| `oxy-nano-series.mp4` | `OxyNanoVideoSection.razor`, `Home.razor` JSON-LD | Product overview / spec walkthrough, no authenticity claim | Produced explainer video (graphics + VO), not documentary footage | OK — not presented as trial evidence |
| `oxyniti_explainer_16x9_tamil.mp4` | `OxyNanoVideoSection.razor` (Tamil locale variant) | Same as above | Produced explainer video, Tamil dub/localisation of the same asset | OK |
| `drone_enhanced.mp4` | Not referenced anywhere in current code | none | Unknown (unused) | **Orphaned** — likely a superseded edit of `drone.mp4`; confirm and delete if so |

## Decorative / UI assets (no provenance claim)

These are icons, illustrations, or generic textures used as UI chrome, not as
evidence of a real installation or trial — no provenance claim is made about
them and none require captioning:

- `efficiency.png/.webp`, `maintenance.png/.webp`, `precision.png/.webp`, `performance.png/.webp` — line-art icons next to feature copy on `About.razor` / `TechnologySection.razor` / `ExploreProductRange.razor`.
- `login.jpg/.avif/.webp`, `login-right.jpg` — generic underwater-texture background on auth pages (`Login.razor`, `Register.razor`, etc.).
- `placeholder.png` — Bootstrap-style loading placeholder used across product/search/account pages.
- `avatar.png` — fallback author avatar styling target for CMS-driven `Testimonials.razor` content; the actual testimonial photos/names come from the CMS (`InfoService.Testimonials`) and are out of this repo's scope — audit them where the CMS content is authored.
- `arun.png` — a named individual's headshot; not currently referenced in any `.razor` file in this repo (check CMS/About content if it is meant to be in use).
- `retrofit-kits.jpg` — not currently referenced in any `.razor` file in this repo.
- `oxyniti.png` — favicon/wordmark.

## Product imagery (out of this repo's scope)

`FeaturedProducts.razor`, `DiscoverProductTypes.razor` and the `/products/*`
pages render product images from `p.Asset?.Url`, fetched at runtime from the
Maker backend/CMS rather than shipped in `wwwroot/`. This audit only covers
static assets checked into this repository; product-catalogue imagery should
be audited where it is uploaded (the CMS/admin tooling), against the same
rule below.

## Findings

No further synthetic-as-real assets were found among the currently
displayed images/videos. `unit-pondside*` and `unit-fishfarm*` (both flagged
in #78) are the only assets that were AI-generated/composited and shown
under an authenticity claim; both have been removed from every page that
displays them (this PR completes the fix that #78's interim change started).
Two video files (`hero-poster.*`, `drone_enhanced.mp4`) and two image files
appear orphaned (unreferenced) and are noted above for cleanup, not because
they pose a trust risk.

## Shot list for the next site visit

So replacement/expansion photography for the Use Cases section can be
captured in one trip:

1. **Wide pond context** — the pond/farm from a distance, showing scale and setting (the kind of shot that currently only exists as drone footage).
2. **Unit at pond edge, with a person for scale** — matching the framing the removed renders faked, but real: imperfect angle, visible cabling, a person operating or standing near the unit.
3. **Panel close-up with legible labels** — pressure gauge, water outlet, gas inlet legible and in focus (the generated stills smeared this text — a real close-up directly rebuts that).
4. **DO meter reading in frame** — the free DO-meter demo is called out in #79 as "the strongest credibility asset on the site"; a photo of an actual meter reading during a demo is high-value.
5. **Install in progress** — hoses being connected, unit being positioned — process shots read as more authentic than a finished, static product shot.

Once captured, these should replace the placeholder-free `FieldFootageSection.razor`
per the original acceptance criteria in #78 (real photos preferred over any
relocated render).
