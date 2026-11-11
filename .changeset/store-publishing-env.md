---
'zerion-wallet': patch
---

Store credentials live in the `store-publishing` environment. `beta.yml` and
`release.yml` submit from a dedicated job (`publish` / `submit-stores`) that
declares the environment and consumes the packaged ZIPs as an artifact, so the
build jobs never receive store secrets and required reviewers, if configured,
gate only the upload.
