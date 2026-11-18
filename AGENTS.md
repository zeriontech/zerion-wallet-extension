## Agent skills

### Issue tracker

Issues live in Linear, team `WLT` (e.g. `WLT-1638`); publishing is deferred until an integration is configured. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default state-role labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); creation is deferred with the Linear integration. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root, decisions in `docs/adr/`. See `docs/agents/domain.md`.

## E2E tests

One Playwright suite covers the extension UI and the dapp
(`e2e/dapp/*.spec.ts`). The dapp tests run against the hosted test dapp by
default; `DAPP_URL` overrides it for a local checkout. Local runs are headless:
no browser window, no focus stealing.

Prerequisite: `ZERION_API_DEVELOPMENT_KEY` in `.env`, so ZPI does not challenge
the suite. The `npm run test:e2e*` preflight copies `.env` from the main
checkout into the current worktree when the worktree has none, and reports only
whether the key is present. Never print `.env`. If the preflight cannot find
the token, stop and ask the user; only use `E2E_ALLOW_NO_TOKEN=1` if the user
accepts Cloudflare flakiness.

```shell
npm run test:e2e                                      # extension + dapp (hosted)
DAPP_URL=http://localhost:9011 npm run test:e2e       # local dapp instead
npm run test:e2e -- e2e/tests/login.spec.ts
npm run test:e2e -- e2e/dapp/signatures.spec.ts --grep "personal_sign"
npm run test:e2e -- --grep "Login"                    # group by title
```

- The preflight builds `dist-e2e` when it is missing or stale; set
  `E2E_SKIP_BUILD=1` to reuse the existing build.
- Background long runs with the agent's job/terminal runner.
- Headless is Chromium's new headless mode (`channel: 'chromium'` in
  `e2e/tests/test.ts`). Never switch the harness to branded Chrome
  (`channel: 'chrome'`): it cannot side-load the extension.
- Local runs stop at the first failure. `E2E_MAX_FAILURES=0 npm run test:e2e`
  runs the rest for flake triage; CI always runs every shard to completion.
- `E2E_HEADED=1 npm run test:e2e -- <args>` (or `npm run test:e2e:headed`)
  opens a real window. Use it only when a human asked to watch or you are
  debugging rendering; it takes over the screen.
- Details: `docs/e2e.md`.
