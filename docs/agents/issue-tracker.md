# Issue tracker: Linear

Issues and specs for this repo live in **Linear**, team key `WLT` (existing example: `WLT-1638`). Code review happens on GitHub; GitHub Issues are **not** the tracker here.

## Status: publishing deferred

No Linear CLI, API token, or Linear MCP server is configured for this repo: no agent working here has a Linear tool. Per the maintainer, Linear setup is intentionally deferred. Until an integration is added, skills must not claim to have published, fetched, or labelled anything.

## Conventions

- **Reference an issue** as `WLT-<n>`.
- **Read an issue**: use a configured Linear integration. If none is available, ask the maintainer to paste the issue body and comments into the conversation.
- **When a skill says "publish to the issue tracker"**: draft the complete title and body in the conversation, then ask the maintainer to create it in Linear and return the identifier. Do not substitute `.scratch/` files and do not create a GitHub issue.
- **Comment / label / close**: same hand-off; state the exact change and target issue.
- **Branch names** embed the issue key in kebab-case, e.g. `wallet-positions-chart-in-the-extension-wlt-1638`.
- **Blocking**: Linear's native "blocked by" relations are canonical once an integration exists. Until then, put `Blocked by: WLT-<n>, WLT-<n>` at the top of the body and treat a ticket as unblocked only when every listed issue is done.

## Pull requests

**PRs as a request surface: no.** PRs are reviewed on GitHub and are not part of the triage queue.

## Wayfinding operations

Used by `/wayfinder`.

- **Map**: a Linear issue in `WLT`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a Linear sub-issue of the map where the team's plan supports sub-issues; otherwise a separate issue with `Part of WLT-<map>` at the top. A `Type:` line records `research`/`prototype`/`grilling`/`task`.
- **Claim**: assign the issue to the driving dev, the session's first write.
- **Resolve**: comment the answer, close the issue, then append a context pointer (gist + link) to the map's Decisions-so-far.
