# Distribution Charts — Network & Protocol allocation on the Stats tab

**Status:** spec ready for implementation · **Linear:** WLT-1638 (branch `wallet-positions-chart-in-the-extension-wlt-1638`)

## Purpose

Add two allocation charts to the Stats tab (`/overview/pnl`) that show how the viewed wallet's value splits **by network** and **by protocol**. Each is an alternating slice-and-dice treemap: a single `W×100px` bar carved into rounded tiles whose areas are proportional to each group's share.

See also: `CONTEXT.md` → Charts (canonical terms used below) and [ADR-0003](../adr/0003-accent-color-from-icon-via-canvas.md) (accent-color strategy).

## Placement

The Stats route renders `VStack gap={20}` with `<WalletPositionsChart>` then `<Pnl>`. Append the two charts **below** `<Pnl>`, in this order:

1. Wallet Balance chart (existing)
2. All-time PnL (existing)
3. **Network Distribution** (new)
4. **Protocol Distribution** (new)

Networks first: it's the always-available, coarser cut.

## Core concepts

- **Distribution chart (treemap)** — the generic, data-agnostic renderer. Takes items `{ id, label, value, iconUrl, accentColor }` and owns the layout, tiles, gate, and tooltip. Two thin adapters feed it.
- **Group** — one item in a chart: a chain (Networks) or a `dapp.id` bucket (Protocols).
- **Others slice** — the trailing tile aggregating every group below **2% of the chart total**. Always rendered last, neutral, no icon.

## Data

### Network Distribution

- Source: `useWalletPortfolio().positionsChainsDistribution` — a ready-made `Record<chainId, number>` (fiat value per chain in the active currency). **Do not** re-derive from positions.
- Drop any entry with value `≤ 0`.
- Resolve each chain's `label` (network name) and `iconUrl` via the networks store (same resolution NetworkSelect2 uses).

### Protocol Distribution

- Source: `useHttpAddressPositions` (backend positions — they carry `dapp`; node/RPC positions do not and are excluded).
- Group by `dapp.id` using `groupPositionsByDapp`. Positions with no dapp fall into the `'wallet'` / spot bucket (`DEFAULT_PROTOCOL_ID`, label "Wallet") — this bucket **counts as a normal group** and is usually the largest.
- Sum each group **gross** (loans **not** subtracted). This deliberately diverges from the positions view's net `getFullPositionsValue` so every area is positive. Drop any group that still sums to `≤ 0`.
- `label` / `iconUrl` come from the group's `dapp` (`name`, `icon_url`); the Wallet bucket uses its default name and the wallet glyph.

### Address & currency

Both adapters read the viewed address via `useAddressParams` and the active `currency` via `useCurrency`, matching the Positions tab. React Query caches are shared, so these reuse the same in-flight requests as the rest of Overview.

### Others folding (both charts)

After building the positive groups and the chart total (`sum of all groups`), fold every group whose `value / total < 0.02` into a single **Others** item (summed value). Others is appended **last** regardless of its summed size.

## Layout — alternating slice-and-dice

> This is **not** a squarified treemap. The reference image provided during grilling informs only the _tile look_ (rounded corners, gaps, centered icon), not the carving algorithm.

Given the chart rect `{ x:0, y:0, w:W, h:100 }`:

1. Sort the displayed groups **descending** by value (Others stays last).
2. Maintain `remainingSum = Σ shares` and a mutable remainder rect.
3. For each item `i`, alternate the cut axis (start **vertical** = left column):
   - **Vertical cut:** tile = `{ x, y, w: w * share/remainingSum, h }`; then `x += tile.w`, `w -= tile.w`.
   - **Horizontal cut:** tile = `{ x, y, w, h: h * share/remainingSum }`; then `y += tile.h`, `h -= tile.h`.
   - `remainingSum -= share`; toggle axis.
4. The **last item fills the entire remaining rectangle.**

This guarantees each tile's pixel area ≈ `share × W × 100`.

Worked sanity check: remainder area after removing items `1..k-1` equals `(Σ shares_{k..n}) × totalArea`; a cut by `share_k / remainingSum` yields a tile of area `share_k × totalArea`. ✓

## Tiles (visual)

- Compute the raw slice rects, then **inset** each tile so neighbors are separated by a **4px gap**; apply an **8px corner radius**.
- Background = **pale tint of the accent color** (translucent / mixed-with-white), not the saturated accent. Full-color icon and (future) text stay legible.
- **Icon:** 24px, centered, shown **only** when the tile is ≥ ~36×36px after the gap inset (final threshold tuned so the icon never overflows). Otherwise the tile is a bare tinted tile.
- **Icon source:** direct `iconUrl` rendered via the NetworkIcon-style `<Image2>`; on missing/broken image fall back to the existing abbreviated-name-on-neutral chip. No DappIconFetcher, no random icon.
- **Others tile:** neutral background, no icon.

### Accent color (see ADR-0003)

- **Popular chains:** small **hardcoded** accent map → crisp, instant.
- **Other chains + all protocols:** derive the dominant color client-side by loading the icon into an offscreen `<canvas>` (`crossOrigin='anonymous'`) and sampling it; **cache per icon URL**; **neutral fallback** when the image is missing or the CDN blocks CORS.
- Extraction is async: tiles paint neutral first, then colorize.

## Tooltip

- A **mouse-following** tooltip (cursor-tracked, like the chart.js tooltips in `AssetChart`/`CandleChart`), kept within the chart bounds.
- Content: **group name**, **fiat value**, and **share of this chart's own total** (tiles sum to 100%).
- The fiat value honors the global **hide-balances** preference — hidden / blurred when the toggle is on (like `BlurrableBalance`); name and % still show. Tile areas encode proportion (not absolute balance), so they remain visible.

## Visibility gate & states

- Render a chart **only when ≥ 3 tiles would display** (after Others folding; Others counts as one tile). Otherwise the chart is **absent from the DOM**.
- **No skeleton, no error message, no empty state** — the section simply isn't mounted until its data resolves and the gate passes. Matches the Perps markets list pattern.
- The two charts gate independently (one can show while the other is hidden).

## Pixel defaults

| Param                     | Value                           |
| ------------------------- | ------------------------------- |
| Chart height              | 100px                           |
| Gap between tiles         | 4px                             |
| Corner radius             | 8px                             |
| Icon size                 | 24px                            |
| Icon-visibility threshold | tile ≥ ~36×36px (tuned in impl) |
| Others threshold          | group < 2% of chart total       |
| Gate                      | ≥ 3 displayed tiles             |

## Code structure

- **Generic, reusable** (in `src/ui/components/`):
  - the treemap component (layout + tiles + tooltip + gate) taking `{ id, label, value, iconUrl, accentColor }[]`;
  - the accent-color extraction util/hook (hardcoded map + canvas + cache + fallback).
- **Data-bound instances** (in `src/ui/pages/Overview/`):
  - `NetworkDistributionChart` — adapter over `positionsChainsDistribution`;
  - `ProtocolDistributionChart` — adapter over `useHttpAddressPositions` grouped by `dapp.id`.
- Both instances are rendered by the Stats route in `Overview.tsx`.

## Out of scope

- Backend-provided accent colors (would retire canvas extraction — see ADR-0003).
- Squarified layout, persistent in-tile labels, tap-to-drill-in.
- Any chart on surfaces other than the Stats tab.

## Open implementation notes

- Tune the icon-visibility threshold empirically so a 24px icon never clips a thin tile.
- Decide the exact "pale tint" recipe (e.g. accent at ~12–16% alpha over the card background) during implementation; keep it readable in both themes.
- Confirm chain-icon CDN URLs are CORS-enabled before relying on extraction for non-hardcoded chains; if not, they fall back to neutral (acceptable).
