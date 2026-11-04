---
'zerion-wallet': minor
---

Release engineering: releases are cut through changesets (`Version Packages` PR → app-token `vX.Y.Z` tag → tag-triggered build, GitHub Release and QA branch), PRs must carry a changeset or the `skip-changeset` label, and `publish-stores.yml` handles manual Chrome Web Store and Firefox AMO submission.
