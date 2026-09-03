# Oxyniti — Owner Actions (Vivian)

> Source: SEO/growth advisory review, 2026-09-03. Everything on this page needs
> account access, physical presence, ad spend, or a business/brand-voice
> decision — none of it can be done by editing the repo. The engineering half
> of the same review lives in [GOALS.md](GOALS.md) G6 →
> [EPICS.md](EPICS.md) E6.x → [FEATURES.md](FEATURES.md) →
> [STORIES.md](STORIES.md) S-6.x.x; items below link to the story that
> unblocks or is unblocked by them. Ready-to-paste content (keyword lists,
> negative keywords) is inlined so you don't have to draft it yourself.

## Priority order (from the advisory)

| # | Action | Effort | Value | Related engineering |
|---|---|---|---|---|
| 1 | Google Search Console: verify + index | 30–60 min | ★★★★★ | — |
| 2 | Google Business Profile: create/complete | 1–2 hrs | ★★★★★ | — |
| 3 | Approve homepage SEO copy | <15 min | ★★★★★ | needs S-6.1.1 |
| 4 | Real field visits → 3–5 case studies | 1–2 days | ★★★★★ | feeds S-6.5.1/.2 |
| 5 | Google Merchant Center free listings | 2–4 hrs | ★★★★☆ | needs S-6.3.1 |
| 6 | Supply entity data (legal name, address, etc.) | 30 min | ★★★★☆ | unblocks S-6.3.2 |
| 7 | Native review of Tamil/Telugu drafts | ~1 day total | ★★★★☆ | needs S-6.6.1/.2 |
| 8 | Film short field-test YouTube videos | ongoing | ★★★★☆ | feeds /pond-demo (S-6.2.1) |

---

## 1. Google Search Console (30–60 min)
- [ ] Verify `oxyniti.com`.
- [ ] Submit the sitemap (already generated with `lastmod`, per the advisory
      — no engineering change needed here).
- [ ] Inspect/request indexing for: `/`, `/aquaculture-oxygenation`,
      `/ras-oxygenation`, `/technology`, `/products`, and each real product
      URL.
- [ ] Check Pages → Indexed/Not indexed and note *why* any page is excluded
      — Search Console will say; don't guess.

## 2. Google Business Profile (1–2 hrs, then ongoing)
- [ ] Create/complete as a service-area business: exact name "Oxyniti",
      `oxyniti.com`, phone/WhatsApp, service areas actually covered,
      "Nano Bubble Generator"/aquaculture-aeration description, product +
      installation photos, field-test videos.
- [ ] Ask every real installation/demo/customer for a genuine Google review
      — don't script the wording, just ask them to describe what they used
      it for (dissolved oxygen, species, location will come up naturally).
- [ ] Post a weekly update initially.

## 3. Approve the homepage copy change (<15 min)
- [ ] Review Claude's draft for S-6.1.1 (new title/H1, tagline demoted to
      subhead) before it merges — this is a brand-voice call, not a
      mechanical SEO fix, and needs your sign-off.

## 4. Field visits → case studies (1–2 days, then ongoing)
For each installation/demo/test, capture: pond area/depth, water volume,
species, stocking density, DO before / after 15 / 30 / 60 min, equipment
model, power consumption, morning DO, farmer comment, photos, a 30-second
video, operating duration, economics where you can substantiate it.
- [ ] First case study — pick a real, already-completed installation.
- [ ] Second and third case studies.
- [ ] Hand each one to Claude to drop into the template (S-6.5.1) once it
      ships — **never invent or round up numbers you didn't measure.**

## 5. Google Merchant Center free listings (2–4 hrs)
- [ ] Sign up / verify the Merchant Center account (India supported, per the
      advisory).
- [ ] Confirm S-6.3.1 (expanded Product/Offer schema) has shipped, then
      submit the product feed.

## 6. Supply entity data (30 min) — unblocks S-6.3.2
Send Claude: legal business name, physical address (or explicitly confirm
none should be published), business email, and links to any genuinely active
LinkedIn/YouTube/Facebook/Instagram accounts. **If any of these don't exist
yet, say so** — Claude will leave the schema property out rather than
inventing a value.

## 7. Native-speaker review of Tamil/Telugu (ongoing)
- [ ] Review Claude's Tamil draft (S-6.6.1) before it's linked from
      navigation.
- [ ] Review Claude's Telugu draft (S-6.6.2) before it's linked from
      navigation.

## 8. YouTube field-test videos (ongoing)
- [ ] Film: DO meter reading → machine operating → DO meter reading after.
      A phone camera is enough, no production needed.
- [ ] Upload with descriptive titles, e.g. "Nano Bubble Generator Test in
      Fish Pond | DO Before & After", "Vannamei Shrimp Pond Oxygenation Test
      – Nano Bubbles", "Fish Pond Aerator Test in Tamil | Oxyniti".
- [ ] Every video description links to `/pond-demo` (once S-6.2.1 ships) or
      WhatsApp.

---

## Google Ads — $1/day Search campaign

All of this needs your Ads account access; the lists below are ready to
paste in once the campaign exists.

- [ ] One Search campaign only — not Display, not YouTube ads, not
      Performance Max yet.
- [ ] Location targeting set to **Presence** (people in/regularly in your
      target geographies), not the broader default that includes people
      merely showing interest in the area.
- [ ] Ad schedule restricted to hours you can respond to WhatsApp/calls
      within about two minutes.
- [ ] Add call, sitelink, and location assets to the ad.
- [ ] Turn on conversion tracking once S-6.4.2 ships — track pond-demo
      submit, qualified WhatsApp enquiry, phone call, and purchase as
      primary conversions; WhatsApp click and call-button click as
      secondary.
- [ ] Send all traffic to `/pond-demo` (S-6.2.1), never the homepage.

**Starter keyword list — phrase/exact only, no broad match:**
- `[nano bubble generator price]`
- `"nano bubble generator for fish farming"`
- `[nano bubble generator india]`
- `"aquaculture oxygenation system"`
- `"nano bubble aerator"`
- `"biofloc oxygenation"`
- `"fish pond oxygen generator"`

**Starter negative-keyword list:**
`aquarium`, `home aquarium`, `DIY`, `homemade`, `jobs`, `vacancy`, `PDF`,
`research paper`, `project report`, `free machine`, `used`, `oxygen tablet`,
`medical oxygen`, `oxygen concentrator`, `spa`, `bathtub`, `skincare`

- [ ] Review Search Terms weekly at first; add every irrelevant query to
      negatives as it turns up.

## GitHub repo metadata (2 min)
- [ ] Add an About description to `revred/oxiniti`: "Website and platform
      for Oxyniti nano-bubble aeration systems for aquaculture." Website:
      `oxyniti.com`. Topics: `aquaculture`, `nanobubbles`, `aeration`,
      `water-treatment`, `fish-farming`.
      *(Claude has no GitHub API token in this session, so this is a
      2-minute manual edit on the repo's GitHub page. If you'd rather Claude
      do it, supply a token with `repo` scope.)*

---

## 30-day sequence (from the advisory)
- [ ] **Days 1–2:** Search Console, Business Profile, conversion tracking
      (once S-6.4.1 ships), homepage copy approval, richer schema, GitHub
      metadata.
- [ ] **Days 3–7:** Merchant Center, first Search campaign live, negative
      keywords applied.
- [ ] **Week 2:** First two real case studies + two YouTube videos.
- [ ] **Week 3:** Tamil review; Telugu next only if geography warrants it.
- [ ] **Week 4:** Read Search Console queries + Ads Search Terms; have
      Claude draft the next landing pages from what people actually
      searched, not guessed keywords.

## Explicitly not worth your time (per the advisory)
Google stopped showing FAQ rich results (May 2026) — don't chase FAQ schema
as a growth lever. `llms.txt` isn't a ranking signal. Skip generic blog posts
and city-page farms (doorway-content risk) in favour of the real case
studies above. Don't chase another 5 points of Lighthouse score — the
marginal hour is worth more in content, distribution, and customer proof.
