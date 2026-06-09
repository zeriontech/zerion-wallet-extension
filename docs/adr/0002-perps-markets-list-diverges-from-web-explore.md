# Perps markets list on Overview diverges from web's /explore/perps

The Perps overview gained a **Markets list** below the open-positions list (browse every tradeable market), modeled on web PR #7 (`PerpsExplorePage`/`PerpRow`/`selectPerps`). Two deliberate deviations from that PR, both driven by the extension's narrow single-column viewport:

1. **All DEXes merged into one list**, rather than web's separate `/explore/perps` and `/explore/stocks` pages (one `dexIdentifier` each). The overview has no room for category tabs, so the ported `selectPerps` merges every DEX's universe (main perps + the `xyz` stocks DEX, sourced from the `dexList` already returned by `useClearinghouseStates`) into a single sorted list. `getPerpDisplayName` strips the `xyz:` prefix for display; rows link to `/perps/:name`, and `PerpPage`/`parsePerpId` already handle the prefixed id.

2. **A `Dialog2` sort selector** (Volume / Price / Change, each descending, default Volume) instead of web's tappable column headers with an asc/desc arrow. Column headers don't fit the extension's width; a dialog of named field rows does. This loses web's ascending toggle by design.

Recorded so a future reader doesn't "fix" the extension back toward web by re-splitting perps/stocks into separate surfaces or porting the column-header sort UI — those were considered and rejected for this viewport.

The markets section is also **supplementary**: it renders only after the open-positions query has finished loading and there is ≥1 market, with no skeleton and no empty/error state — unlike web, which shows a skeleton and a "no markets available" message.
