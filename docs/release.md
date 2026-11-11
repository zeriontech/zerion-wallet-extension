# Releases

Everything that cuts a release lives in `.github/workflows/`. Every action is pinned to a commit SHA, checkouts use `persist-credentials: false`, and secrets are scoped to the step that needs them.

## Gate matrix

| Event        | Workflow               | What runs                                                                                                                                                                                                                                            |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull request | `ci.yml`               | `changeset-check` (or the `skip-changeset` label), `static` (`lint:check`, `format:check`, `typecheck`), `test` (`test:unit`), `build` (same-repo PRs; zip attached to the PR), `e2e` (same-repo PRs, sharded 5 ways). All gate jobs run in parallel |
| Push `main`  | `ci.yml`               | `static`, `test`, `build` (post-merge signal; no PR comment, no e2e)                                                                                                                                                                                 |
| Push `main`  | `version-packages.yml` | opens/updates the **Version Packages** PR; tags the merged version bump                                                                                                                                                                              |
| Push `main`  | `beta.yml`             | beta build (coral icons, own Firefox id, fourth version part) and, when configured, upload to the beta store items                                                                                                                                   |
| Tag `vX.Y.Z` | `release.yml`          | build Chrome + Firefox, zip + tar.gz, GitHub Release, Slack, and (when configured) upload to the production store items                                                                                                                              |
| Manual       | `publish-stores.yml`   | rebuild a tag, submit to the Chrome Web Store and/or Firefox AMO                                                                                                                                                                                     |

All gates run on the Vite+ toolchain — Oxlint, Oxfmt, Vitest and TSRS; see `docs/build.md`.

`release.yml` deliberately skips lint, typecheck, formatting and tests: a tag is only created for a commit that already passed every PR gate, so an emergency release is never blocked by CI. Quality gates stay on pull requests.

## Release flow (changesets)

1. Every behavior-changing PR includes a changeset (`npm run changeset`, commit the generated `.changeset/*.md`). Docs/CI/dependency-only PRs use the `skip-changeset` label. The `changeset-check` job fails with the exact command to run when a changeset is missing.
2. On merge to `main`, `version-packages.yml` runs `changesets/action`, which opens or updates the **Version Packages** PR.
3. Merging that PR bumps `package.json`, runs `node scripts/manifest-version.js` (so `src/manifest-chrome.json` and `src/manifest-firefox.json` stay in sync), writes `CHANGELOG.md`, and deletes the consumed changesets.
4. With no changesets left, `version-packages.yml` runs `scripts/release/tag-version.mjs`, which creates and pushes the annotated `vX.Y.Z` tag. It is a no-op when that tag already exists.
5. The tag push triggers `release.yml` (artifacts + GitHub Release + Slack + store upload).

Tagging belongs to CI only. `scripts/manifest-version.js` no longer creates or amends commits or tags.

`.changeset/config.json` sets `format: false`: Changesets would run its own formatter on `CHANGELOG.md`, and `npm run version` formats it with `vp fmt` instead, so the Version Packages PR still passes `format:check`.

## Beta channel

There is a second listing of the extension in both stores, used as the beta channel. It is the **same bundle** as production with three differences:

- the eight icon files are exchanged in the **finished bundle** (`src/images/beta/`, generated from the production artwork by swapping the background colour, so the silhouette, rounding and per-size anti-aliasing are identical). `scripts/build-beta.js` runs the same `build.js` / `build-firefox.js` as production and then overwrites the emitted, content-hashed PNGs in place, so every JS and CSS file in the beta ZIP is byte-identical to production — only the icons and the manifest version differ;
- the Firefox build gets the add-on id `beta@zerion.io`, because AMO keys an add-on by that id and the beta listing is a separate item (Chrome items are keyed by the store item, so the same ZIP can be uploaded to both);
- the manifest version gets a fourth part, `<major>.<minor>.<patch>.<run>`, so every upload is a new version (manifests allow at most four parts).

`beta.yml` runs on every push to `main`: it builds both targets with `npm run build:beta`, writes store-shaped ZIPs with the same packaging script as production and submits them to the beta items. Because beta reuses the production build, packaging and submission path, a green beta run is also the check that the production path works; the two differ only in their trigger and in the store item ids. **The upload is skipped, not failed, when the beta item ids are not configured** – the build and its artifacts are still produced. The same rule applies to production in `release.yml`: a tag publishes the release, and the store submission runs only if `CHROME_EXTENSION_ID` / `FIREFOX_EXTENSION_ID` are configured.

What "submit" means differs by channel:

|                          | Chrome Web Store                                                                                                           | Firefox AMO               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Beta (every `main` push) | upload, submit and publish immediately                                                                                     | upload, submit for review |
| Production (tag)         | **upload only** (`CHROME_SKIP_SUBMIT_REVIEW`); publish from the dashboard so the canary / staged rollout is chosen by hand | upload, submit for review |

Store visibility is a dashboard setting, not something the API can set:

- **Chrome Web Store**: create the second item and set visibility to _Private_ with the organisation's domain in the trusted testers list.
- **Firefox AMO**: publish the beta add-on as _Unlisted_ (installs are possible with the link only) or listed with restricted access, depending on what the reviewer flow allows for the account.

Icons and the beta build are also what the QA build uses on PRs; that path is unchanged.

### Why a GitHub App token

The tag push uses a token minted from `RELEASE_APP_ID` / `RELEASE_APP_PRIVATE_KEY`, never `GITHUB_TOKEN`:

- pushes made with `GITHUB_TOKEN` do not trigger other workflows, so `release.yml` would never run;
- the org ruleset `hive-protect-tags` (active) only allows tag creation by its bypass actors.

The app needs `contents: write` on this repository (plus `pull-requests: write` so `changesets/action` can open the Version Packages PR) and must be listed as a bypass actor on `hive-protect-tags`. Misconfiguration fails the workflow before the tag is created: the preflight step fails when the app token cannot read the repository, and `tag-version.mjs` fails with an error naming `RELEASE_APP_ID` and `hive-protect-tags` when the push is rejected.

The app is `zerion-ci-release-extension`, installed only on this repository. zerion-web-app has its own App (`zerion-ci-release`): any key of an App can mint tokens for every repo it is installed on, so the two repos must not share one. `RELEASE_APP_ID` / `RELEASE_APP_PRIVATE_KEY` are secrets of the `release` environment, whose deployment branches are limited to `main`, and the `version-packages` job declares `environment: release`. Do not copy them into repository or organization secrets: those are readable by a workflow pushed on any branch, and the key can push release tags past `hive-protect-tags`.

## Store publishing

`publish-stores.yml` is manual only, defaults to `dry_run: true`, and runs in the `store-publishing` environment so real submissions can require approval.

### Tool choice: `publish-browser-extension`

`wxt submit` is an alias for [`publish-browser-extension`](https://www.npmjs.com/package/publish-browser-extension) (the WXT docs say so, and `wxt submit --help` reports `publish-extension`). We install the underlying package directly instead of WXT: same functionality, 3 runtime dependencies (`cac`, `tasuku`, `@topcli/prompts`), no framework coupling to this repo's Parcel-era build (now Vite).

What it gives us in one command: Chrome upload + publish, Firefox upload + submit with a sources ZIP, and `--dry-run` that authenticates against both stores without uploading. We call it through `scripts/release/publish-stores.mjs` so we get per-store statuses for Slack and a redacted failure path.

Rejected alternatives:

- `chrome-webstore-upload-cli` + `web-ext sign`: two tools, two auth models, no shared dry-run. The CLI documents only OAuth `CLIENT_ID`/`CLIENT_SECRET`/ `REFRESH_TOKEN`, i.e. Chrome Web Store API **v1.1**, which Google retired on 2026-10-15; `web-ext` alone pulls ~27 dependencies.
- Plasmo's submit: tied to Plasmo's build output and framework; this repo builds with Vite+ (see `docs/build.md`).

Tradeoff: we depend on a single third-party submitter covering both stores. If it breaks, store submission is manual (upload the same ZIPs by hand) until it is fixed; nothing else in the release flow depends on it.

### Required secrets

| Secret                                | For     | Notes                                                         |
| ------------------------------------- | ------- | ------------------------------------------------------------- |
| `CHROME_EXTENSION_ID`                 | Chrome  | Extension ID in the Web Store                                 |
| `CHROME_PUBLISHER_ID`                 | Chrome  | Publisher ID from the developer dashboard                     |
| `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | Chrome  | CWS API v2 service account                                    |
| `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`  | Chrome  | Service account key, newlines may be literal `\n`             |
| `FIREFOX_EXTENSION_ID`                | Firefox | AMO add-on id/slug                                            |
| `FIREFOX_JWT_ISSUER`                  | Firefox | AMO API key                                                   |
| `FIREFOX_JWT_SECRET`                  | Firefox | AMO API secret                                                |
| `CHROME_BETA_EXTENSION_ID`            | beta    | Chrome item id of the beta listing; upload skipped when unset |
| `FIREFOX_BETA_EXTENSION_ID`           | beta    | AMO id of the beta listing; upload skipped when unset         |
| `SLACK_AUTH_TOKEN`                    | both    | Already used by `release.yml`                                 |

`CHROME_API_VERSION=v2` is set in the workflow, not stored as a secret. The script refuses to run with anything else: CWS API v1.1 stopped working on 2026-10-15.

All store credentials live in the **`store-publishing` environment**, never in
repository secrets. The workflows that need them declare it on a dedicated job,
so the build jobs never see them:

| Workflow             | Job with `environment: store-publishing` |
| -------------------- | ---------------------------------------- |
| `beta.yml`           | `publish` (`needs: build`)               |
| `release.yml`        | `submit-stores` (`needs: release`)       |
| `publish-stores.yml` | `publish`                                |

Adding required reviewers to that environment therefore gates the upload only:
a beta build still runs on every `main` push, and a tag still produces the
GitHub Release, while the submission waits for approval. Without reviewers the
uploads stay automatic and are skipped when the item ids are unset.

One consequence worth knowing: a job only sees environment secrets of the
environment it declares. If the ids were added as repository secrets instead,
the jobs would still read them (repository secrets are visible everywhere), but
the environment would no longer be the single place they live.

### Manual first run

1. Upload both extensions to the stores by hand once; neither store creates a new listing through the API.
2. Add the secrets above to the `store-publishing` environment.
3. Run `publish-stores.yml` with the default `dry_run: true`. This rebuilds the tag, creates the ZIPs and authenticates against both stores; a green run means the credentials are valid.
4. Run it again with `dry_run: false` for the real submission, then watch the Chrome Web Store dashboard and AMO for review results.

### Firefox sources ZIP

AMO requires source code that reproduces the submitted build. `scripts/release/store-zips.mjs` creates `zerion-wallet-firefox-addon-<tag>-sources.zip` with `git archive` of the released tag; it contains `SOURCE_CODE_REVIEW.md` with the rebuild steps. Review that file whenever the build changes.

### Re-running after a partial failure

Submission is not transactional: if Chrome succeeded and Firefox failed, both stores are attempted again on re-run, and the store that already accepted the version rejects the duplicate. Bump the version and cut a new release rather than re-running for a half-published version.

## Emergency release

1. Bump the version and sync the manifests: `npm version <bump> --no-git-tag-version` (the `version` lifecycle hook skips `changeset version` and only syncs the manifests; `postversion` does the same). Plain `npm version` also works but tags before the manifest sync is committed, so prefer the explicit two-step.
2. Add the `CHANGELOG.md` entry, commit and merge to `main`.
3. Create and push the tag with an account that is a bypass actor on `hive-protect-tags`: `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`.
4. `release.yml` runs from the tag and uploads to the production store items (Chrome draft only). Publish from the Chrome Web Store dashboard once the release looks right.

## Deliberate gaps

- `release.yml` runs no quality gates by design; it trusts that the tagged commit passed CI. The tag ruleset, not the workflow, is what keeps unreviewed commits out.
- No automatic store publishing after a release: a tag produces a GitHub Release and a QA build, and a human starts `publish-stores.yml`.
- No store retry/rollback logic (see above).
- The `hive-protect-tags` bypass list lives in org settings; the repository cannot verify it, only fail loudly when it is wrong.
- Bundle size is not gated.
