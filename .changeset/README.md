# Changesets

Every pull request that changes behavior must include a changeset. Run `npm run changeset`, choose the bump type, and commit the generated `.changeset/*.md` file.

Docs, CI and dependency-only changes can carry the `skip-changeset` label instead.

When changesets land on `main`, the `Version Packages` workflow opens (or updates) a **Version Packages** pull request. Merging that PR bumps `package.json`, syncs both manifests, writes `CHANGELOG.md`, and pushes a `vX.Y.Z` tag that triggers the release workflows.

See `docs/release.md` for the full gate matrix and release flow.
