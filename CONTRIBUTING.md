# Contributing

## Imagery & provenance

**No generated or composited imagery in any section that makes a
provenance, trial, or customer-installation claim.** If copy near an image
or video says (or implies) "real", "live trial", "installed", "footage", or
similar, the asset must be genuine camera-captured photo/video — not an
AI-generated, AI-composited, or otherwise synthetic image.

Renders, illustrations, and product visualizations are welcome, but must be
placed in a section that makes no such claim, and captioned clearly as a
render/visualization so a viewer cannot mistake it for evidence.

Before adding a new image or video to `wwwroot/images/` or `wwwroot/videos/`
and referencing it from a claim-making section (Use Cases, Results, any
"real footage" / "live trial" copy), add a row for it to
[`docs/image-provenance.md`](docs/image-provenance.md) recording its source,
where it is used, and what claim (if any) the surrounding copy makes.

This rule exists because of
[#78](https://github.com/revred/Oxiniti/issues/78): two AI-generated,
composited product-unit renders were shipped captioned as trial photography
in the homepage Use Cases section, directly under a "No studio. No CGI."
headline — see [#79](https://github.com/revred/Oxiniti/issues/79) for the
follow-up audit.
