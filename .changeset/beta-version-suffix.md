---
'zerion-wallet': patch
---

Beta build: read the manifest version suffix from `BETA_VERSION_SUFFIX` when the
`--version-suffix` flag is not passed. `beta.yml` only exported the variable, so
the beta ZIP kept the production version and the store packaging step refused it
(`dist/manifest.json has version 1.45.2, but the build should be 1.45.2.<run>`),
which failed the beta workflow on every `main` push.
