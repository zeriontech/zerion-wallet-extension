# Accent color from icon via canvas (not a library, not hardcode-only)

The distribution treemaps tint each tile with an accent color. Popular chains use a small **hardcoded** accent map (crisp, instant, no flicker). For every other chain and **all** protocols we derive the accent **client-side** by loading the icon into an offscreen `<canvas>` (`crossOrigin='anonymous'`) and sampling its dominant color, cached per icon URL, with a neutral fallback when the image is missing or the CDN blocks CORS.

## Considered options

- **Add a color-extraction dependency** (`node-vibrant` / `color-thief`) — rejected: extra bundle weight in an extension for one cosmetic feature, and it still needs the same canvas/CORS plumbing underneath.
- **Hardcode-only + neutral for everything else** — rejected: protocols (hundreds of dapps, no brand-color source in the repo) would all look bland; deriving from the icon is the whole point for protocols.
- **Backend-provided accent color** — not available today; would be the cleaner long-term answer.

## Consequences

- Extraction is **async**: tiles paint with the neutral fallback first, then colorize once the icon decodes. Acceptable for a secondary, gated chart.
- Depends on icon URLs being **CORS-enabled**; when they aren't, the tile stays neutral. This is a silent, per-tile degradation, not an error.
- If a backend accent color ever ships, the extraction path should be retired in favor of it.
