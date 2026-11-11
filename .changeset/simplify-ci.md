---
'zerion-wallet': patch
---

One CI workflow instead of four: `ci.yml` carries the changeset gate, static
checks, unit tests, the production build (with its zip attached to the PR by the
build job itself) and the sharded e2e suite. The separate `pr.yml` /
`pr_attach_build.yml` build path and the `zerion-wallet-extension-qa` mirror
(`pr_push_qa.yml`, `release_push_qa.yml`, the `push_qa_repo` action and the dev
manifest script) are gone; QA installs come from the build artifact on the PR.
