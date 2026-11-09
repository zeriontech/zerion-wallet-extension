---
'zerion-wallet': minor
---

Build and checks run on Vite+: Parcel is replaced by `vp build` (Rolldown) for both extension targets, ESLint/Prettier by Oxlint/Oxfmt, Jest by Vitest, and `tsc` by TSRS. PR gates run static checks, unit tests and the production build in parallel; the Chrome build drops from ~14 s to ~1.6 s and the unit suite from ~22 s to ~9 s on the same machine.
