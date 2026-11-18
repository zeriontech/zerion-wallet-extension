# Hotfix release

Use this when the **last published version** is broken and `main` already contains
unreleased work. A hotfix ships only the fix: it is branched from the release
tag, not from `main`, so nothing queued on `main` reaches users early.

Examples: a missing font or image after a bundler migration, a broken store
submission, a regression in the version that is already live.

## Rules

- Branch from the release tag of the broken version, never from `main`.
- The fix commit contains the fix, its regression test and a changeset.
- Keep the version bump in a separate commit. It is **not** backmerged.
- The tag points at the hotfix HEAD containing the version commit and triggers
  `release.yml`.
- Backmerge only the fix commit(s); never merge the version bump into `main`.
- `release.yml` runs no quality gates. CI proof comes from the backmerge PR (or
  the local gates if the release cannot wait).

## 1. Create the hotfix branch

```bash
git fetch --tags origin
# v1.46.0 is the broken release; the hotfix becomes v1.46.1
git switch -c hotfix/v1.46.1 v1.46.0
```

`git describe --tags` must show a clean release tag as the branch point, not a
commit ahead of it.

## 2. Apply the fix

Keep the change set minimal: the fix, a regression test that fails on the
release tag without the fix, and a changeset.

```bash
npm run build:e2e
npx playwright test e2e/tests/<new-test>.spec.ts
node scripts/e2e-shards.mjs --verify --total=5   # every test assigned to a shard

npm run typecheck
npm run lint:check
npm run test:unit
npm run build:production
```

For bundled assets, also inspect the output directly: a passing e2e test is
required, but `grep` the artifact so a later bundler change cannot silently drop
it again. Example: `grep -c '@font-face' dist/assets/style-*.css`.

Commit the fix:

```bash
git add <files>
git commit -m "fix: <what and why>"
```

Record this commit SHA. It is the only commit that goes back to `main`.

## 3. Prepare the version commit

```bash
npm version 1.46.1 --no-git-tag-version
# add the CHANGELOG.md entry under ## 1.46.1
git add package.json package-lock.json src/manifest-chrome.json \
  src/manifest-firefox.json CHANGELOG.md
git commit -m "chore(release): 1.46.1"
```

`npm version` runs the `version` lifecycle hook, which syncs
`src/manifest-chrome.json` and `src/manifest-firefox.json`. Do not use plain
`npm version`: it tags before the manifest sync is committed.

The tag, `package.json` and both manifests must carry the same version;
`scripts/release/store-zips.mjs` refuses to package a mismatch.

## 4. Get CI proof

Push the hotfix branch, then open the backmerge PR so the fix runs through the
normal gate:

```bash
git push -u origin hotfix/v1.46.1

git fetch origin
git switch -c backmerge/1.46.1 origin/main
git cherry-pick <fix-commit-sha>
git push -u origin backmerge/1.46.1

gh pr create --base main --head backmerge/1.46.1 \
  --title "Backmerge 1.46.1: <summary>" \
  --body "Cherry-pick of <fix-commit-sha> from hotfix/v1.46.1. The version commit is intentionally excluded."
```

Cherry-pick docs-only commits from the hotfix branch too; they do not carry the
version bump. Only `chore(release):` commits stay behind.

Contexts from the tag, not `main`. The changeset in the fix commit satisfies
`changeset-check`, and the PR runs lint, typecheck, unit tests, the production
build and e2e.

Urgent path: ship from the tag as soon as the local gates above pass. CI on the
backmerge PR still has to be green before that PR merges, but it does not block
the tag.

## 5. Tag the release

`version-packages.yml` cannot create this tag: it only runs on `main` and tags
the merged Version Packages commit. For a hotfix, create the tag yourself on the
hotfix HEAD. The tag push must come from an account or App that is a bypass
actor on the `hive-protect-tags` ruleset.

```bash
git switch hotfix/v1.46.1
git log --oneline -2                       # confirm the version commit is at or below HEAD
git tag -a v1.46.1 <hotfix-head-sha> -m v1.46.1
git push origin v1.46.1
```

Tag the current hotfix HEAD, not an intermediate commit: it must contain the
version commit (docs-only commits above it are fine).

A rejected tag push means the account is not a bypass actor. Do not delete or
move an already pushed tag; cut the next patch version instead.

## 6. Watch `release.yml`

The tag triggers the release workflow, which:

- builds Chrome + Firefox from the tag,
- creates the GitHub Release and the store ZIPs,
- notifies Slack,
- uploads to the production store items.

Chrome is upload-only; publish from the Chrome Web Store dashboard so the
rollout is chosen by hand. Firefox is submitted for review. If `release.yml` or
a store upload fails, fix forward with a new patch version rather than re-tagging
the same one.

## 7. Backmerge to `main`

Merge the backmerge PR opened in step 4. It contains only the fix commit, its
test and the changeset.

Do **not** merge `hotfix/vX.Y.Z` into `main`: it carries the version bump and
would move `main` backwards (or skip its pending changesets). Do not
cherry-pick the `chore(release):` commit.

The changeset rides along, so the next Version Packages PR on `main` records the
fix in the next changelog. That a fix appears in both the hotfix changelog and
the next minor's changelog is expected across release lines.

If `scripts/e2e-shards.mjs` conflicts, keep `main`'s entries and add only the
new test rows.

After the backmerge PR merges and the release is published, delete the
`hotfix/` and `backmerge/` branches. Keep the tag.

## Checklist

- [ ] Branch cut from the release tag, not `main`
- [ ] Fix commit includes a regression test and a changeset
- [ ] Local build/typecheck/lint/unit/e2e gates pass
- [ ] Version bump commit is separate from the fix
- [ ] `package.json` and both manifests have the release version
- [ ] `CHANGELOG.md` has the release entry
- [ ] Backmerge PR is green
- [ ] Tag points at the hotfix HEAD containing the version commit and is pushed by a ruleset bypass actor
- [ ] `release.yml` is green and store uploads succeeded
- [ ] Chrome release published from the dashboard
- [ ] Backmerge PR merged; version commit was not merged
- [ ] Temporary branches deleted

## Worked example: v1.46.1

| Step           | Ref                                                                        |
| -------------- | -------------------------------------------------------------------------- |
| Broken release | `v1.46.0`                                                                  |
| Hotfix branch  | `hotfix/v1.46.1`                                                           |
| Fix commit     | `4fac09be` — font/asset restore, e2e tests, changeset                      |
| Version commit | `ffac8f7f` — `1.46.1` in package and manifests, CHANGELOG                  |
| Release tag    | `v1.46.1` on the hotfix HEAD (version commit `ffac8f7f` plus this runbook) |
| Backmerge      | cherry-pick `4fac09be` onto `main`                                         |
