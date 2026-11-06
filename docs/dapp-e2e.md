# Dapp end-to-end tests

The dapp suite drives the built extension from the real [zerion-test-dapp](https://github.com/janek26/zerion-test-dapp): EIP-6963 discovery, connection approval, chain changes, message/typed-data signing, and transaction approval. It launches a fresh persistent Chromium profile per test through `createExtensionTest`, so tests do not share wallet state.

## Run locally

Prerequisites:

- Node >= 22.12 (CI uses Node 24).
- A reachable test dapp. Use the hosted deployment
  `https://zeriontech.github.io/zerion-test-dapp/`, or start your own checkout
  of `zerion-test-dapp` outside this repository.
- Extension dependencies installed (`npm ci`).
- `ZERION_API_DEVELOPMENT_KEY` in `.env` if ZPI is behind the Cloudflare
  challenge. The suite starts `e2e/proxy.mjs`, which adds the bypass header
  outside Chromium; the secret is never compiled into the extension or written
  to a trace.

`DAPP_URL` is required to run the dapp tests; when it is unset they are
reported as skipped and the normal extension suite still runs. The suite never
checks out, installs, or starts the test dapp; the URL is the only contract.

```shell
# Run the whole e2e suite (extension + dapp) against the hosted dapp.
DAPP_URL=https://zeriontech.github.io/zerion-test-dapp/ npm run test:e2e

# Or only the dapp-focused config.
DAPP_URL=https://zeriontech.github.io/zerion-test-dapp/ npm run test:e2e:dapp

# Or a dapp you started yourself (must be http://localhost or HTTPS).
DAPP_URL=http://localhost:9011 npm run test:e2e:dapp
```

`npm run test:e2e` without `DAPP_URL` runs the extension tests and marks the
dapp tests skipped, so local extension work does not need a dapp.

Useful variants:

```shell
# Forward Playwright flags.
DAPP_URL=https://zeriontech.github.io/zerion-test-dapp/ \
  npm run test:e2e:dapp -- --grep "personal_sign" --headed

# Run Playwright directly against any reachable dapp.
DAPP_URL=http://localhost:9011 npx playwright test \
  --config playwright.dapp.config.ts

# Force a fresh build or reuse the existing one.
npm run build:e2e && E2E_SKIP_BUILD=1 npm run test:e2e:dapp
```

Without `CI` the harness runs headed, like the existing extension tests. CI
runs the suite under `xvfb-run`; the shared harness uses headless mode there. `npm run test:e2e:dapp` builds `dist-e2e`
(not `dist/`) because that is the E2E-only build with pinned feature flags and
an optional local-proxy API URL. It compares the manifest mtime with `src/`,
`package.json`, and the build config; set `E2E_SKIP_BUILD=1` to disable the
check.

### Configuration

| Variable         | Default    | Purpose                                                                                                                                                                                                                        |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DAPP_URL`       | unset      | The only dapp input. Unset means dapp tests are skipped. Must be `http://localhost`, `http://0.0.0.0`, or HTTPS because that is where the extension content script injects. `http://127.0.0.1` is rejected with a clear error. |
| `E2E_PROXY_PORT` | `4789`     | Local proxy port used when a ZPI bypass secret is configured.                                                                                                                                                                  |
| `E2E_USE_PROXY`  | unset      | Set to `1` to build against the proxy even without a secret (CI uses it so the build never sees the secret).                                                                                                                   |
| `E2E_DIST`       | `dist-e2e` | Extension build directory used by the harness.                                                                                                                                                                                 |
| `E2E_SKIP_BUILD` | unset      | Set to `1` to skip the staleness check in `npm run test:e2e:dapp`.                                                                                                                                                             |

### Hosted dapp

The suite runs unchanged against the hosted deployment:

```shell
DAPP_URL=https://zeriontech.github.io/zerion-test-dapp/ npm run test:e2e:dapp
```

The URL must be HTTPS (the content script does not inject on non-local HTTP).
`request.html` is resolved relative to `DAPP_URL`, so a deployment under a
subpath works as long as the dapp serves both pages under that path. The
hosted origin must pass the wallet's ZPI security check; if ZPI flags it as
malicious, the wallet replaces the dapp tab with the block page and no approval
window opens. In that case use a local `DAPP_URL` or have the origin
allowlisted.

## CI

The dapp tests are part of the normal `e2e` job in
`.github/workflows/run-tests.yml`. There is no separate dapp workflow:

- The e2e matrix has five shards. `scripts/e2e-shards.mjs` assigns all 22
  extension tests and all 13 dapp tests to exactly one shard.
- `DAPP_URL=https://zeriontech.github.io/zerion-test-dapp/` is set for every
  shard; there is no test dapp checkout, install, or dev-server step.
- Builds `dist-e2e` with `E2E_USE_PROXY=1`; the bypass secret is only in the
  proxy and test steps, never the build.
- Runs `xvfb-run npx playwright test --grep ... --workers=2`, uploads
  `e2e-report/` on failure after scanning it for the secret.

Fork pull requests do not have the ZPI bypass secret, so the e2e job is
skipped for them (`head.repo.full_name == github.repository`). The test dapp
itself requires no secrets; if a public ZPI endpoint is available later, the
job can be opened to forks by removing that condition.

## Coverage matrix

The matrix matches the tests in `e2e/dapp/`. "Covered" means the real dapp UI and the real extension approval window are both exercised.

| Feature                                                        | Test                                               | Status                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| EIP-6963 discovery of Zerion (`io.zerion.wallet`)              | `connection.spec.ts` — discovery                   | Covered                                                                                         |
| `eth_requestAccounts` approve, dapp status address/chain       | `connection.spec.ts` — discovery                   | Covered                                                                                         |
| `eth_requestAccounts` reject and retry                         | `connection.spec.ts` — reject                      | Covered                                                                                         |
| `eth_accounts` without a prompt                                | `connection.spec.ts` — discovery                   | Covered                                                                                         |
| `wallet_getPermissions` card                                   | `connection.spec.ts` — discovery                   | Covered                                                                                         |
| Clear active provider and reconnect without approval           | `connection.spec.ts` — reconnect                   | Covered                                                                                         |
| `wallet_switchEthereumChain` approve; `chainChanged` in status | `networks.spec.ts` — switch                        | Covered                                                                                         |
| `wallet_switchEthereumChain` user rejection                    | `networks.spec.ts` — switch rejection              | Covered                                                                                         |
| `wallet_addEthereumChain` approval and switch                  | `networks.spec.ts` — add chain                     | Covered (test dapp's Localhost 8546 / Elysium Testnet update flow)                              |
| `personal_sign` approve                                        | `signatures.spec.ts` — personal_sign               | Covered                                                                                         |
| `personal_sign` reject                                         | `signatures.spec.ts` — personal_sign               | Covered                                                                                         |
| `eth_signTypedData_v4` approve/reject                          | `signatures.spec.ts` — typed data v4               | Covered                                                                                         |
| SIWE message signing                                           | `signatures.spec.ts` — SIWE/Permit                 | Covered (as `personal_sign`; wallet does not parse SIWE)                                        |
| PermitSingle fixture                                           | `signatures.spec.ts` — SIWE/Permit                 | Covered                                                                                         |
| Malformed typed data                                           | —                                                  | Not covered; see gaps. The wallet opens a raw approval window instead of rejecting the payload. |
| `eth_sendTransaction` approval surface and cancel              | `transactions.spec.ts` — approval                  | Covered                                                                                         |
| `eth_sendTransaction` user rejection (4001)                    | `transactions.spec.ts` — rejection                 | Covered                                                                                         |
| Malformed `personal_sign` params rejected before approval      | `unsupported-features.spec.ts` — malformed payload | Covered                                                                                         |
| `eth_sign`                                                     | `unsupported-features.spec.ts`                     | Unsupported by wallet: `eth_sign: Not Implemented`                                              |
| `eth_signTypedData` (v1)                                       | `unsupported-features.spec.ts`                     | Unsupported: `Not Implemented`                                                                  |
| `eth_signTypedData_v3`                                         | `unsupported-features.spec.ts`                     | Unsupported: method does not exist                                                              |
| `wallet_watchAsset` (EIP-747)                                  | `unsupported-features.spec.ts`                     | Unsupported: no handler; dapp shows an add-token error                                          |
| `wallet_sendCalls` (EIP-5792)                                  | `unsupported-features.spec.ts`                     | Unsupported: method does not exist                                                              |

## Gaps

### Test-dapp features the wallet does not implement

- **`eth_sign` and typed-data v1/v3.** `src/background/Wallet/Wallet.ts` explicitly throws `MethodNotImplemented` for `eth_sign` and `eth_signTypedData`; v3 has no handler. The dapp-visible errors are asserted in `unsupported-features.spec.ts`.
- **EIP-747 `wallet_watchAsset`.** No handler exists in the wallet. The dapp's Add Token card reports an error and no approval window opens.
- **EIP-5792.** `wallet_sendCalls`, `wallet_getCallsStatus`, and `wallet_getCapabilities` have no handlers. The EIP-5792, sponsorship, and atomic-batch cards therefore cannot run.
- **`wallet_revokePermissions`.** No handler; the dapp's "Revoke Accounts Permission" card can only show an error. Disconnect is exercised through the extension-independent "Clear active provider" action instead.
- **Encryption (`eth_getEncryptionPublicKey` / `eth_decrypt`).** No handlers in the wallet.
- **Malformed typed data is not rejected at the RPC boundary.** Every `eth_signTypedData_v4` malformed fixture (invalid type, empty domain, untyped extra data, invalid primary type, missing primary type, invalid verifying-contract type) opens a normal `Sign Message` approval window with the raw payload. The suite records this as a gap rather than a pass. A malformed transaction also opens the approval window, but confirming it depends on the transaction simulation backend (locally `Invalid params`, in CI HTTP 403), so that path is not asserted; it never broadcast in either observed case.
- **ERC-20 / ERC-721 / ERC-1155 token flows, contract deploy, swaps, sponsorship, batch calls.** The wallet sends these as ordinary `eth_sendTransaction`, but the dapp flows need a deployed contract and a funded account (see below). They are not marked as passing.
- **PPOM / malicious-request fixtures.** Zerion has origin-level phishing defence (`src/modules/phishing-defence`, `DappSecurityCheck`), but no MetaMask-style transaction PPOM. The malicious fixtures are not exercised.

### Wallet dapp features the test dapp cannot exercise

- **WalletConnect pairing from Zerion mobile.** The dapp can render a WalletConnect QR, but the suite has no mobile wallet. Pairing is not covered.
- **Hardware wallets (Ledger).** Covered separately by `e2e/tests/connect-ledger.spec.ts`, not from a dapp.
- **SIWE edge cases.** The dapp's bad-domain/bad-account/malformed SIWE fixtures are still plain `personal_sign` payloads; the wallet displays the message and signs it without validating SIWE semantics. Only the normal SIWE message is asserted as covered.
- **Multi-wallet / ecosystem selection.** The suite onboards one EVM wallet (Alice); the wallet's wallet-picker and Solana flows are not reached.
- **Solana dapp methods.** The test dapp is EVM-only.

### Environment limitations

- **No funded testnet account.** `testWallets.alice` has no Sepolia balance. The transaction approval window is covered and asserts the real "Insufficient balance" state, but a broadcast transaction hash and the ERC-20/721/1155 flows cannot be covered without a funded key or faucet. Do not add funded mainnet keys here.
- **ZPI Cloudflare challenge.** Without `ZERION_API_DEVELOPMENT_KEY`, approval windows can stay on loading states. The suite starts the local proxy when the secret is in `.env`. CI supplies it only to the proxy/test steps.
- **Localhost-only injection.** Use `http://localhost:<port>`, never `http://127.0.0.1:<port>`; the config rejects the latter.
- **Dapp network label lag.** After `chainChanged`, the dapp's `#network` decimal label can stay stale while `#chainId` updates. Tests assert `#chainId` and the connection card, which are the authoritative values.
- **Testnet/RPC availability.** Add-chain uses the dapp's hardcoded Localhost 8546 params; the wallet knows that chain as Elysium Testnet in the current build, so the test accepts an RPC URL update. A future network-list change may require updating the expected chain name.
- **Hosted origin security check.** ZPI must not flag `DAPP_URL` as malicious. If it does, the wallet replaces the dapp tab with the block page and no approval window opens. Use a local URL or have the origin allowlisted.
- **Hosted dapp is mutable.** CI follows the deployed GitHub Pages build. A dapp deploy that renames ids or changes flows can break selectors; pin a custom domain/deployment if strict determinism is required.

## Test-dapp change recommendation

No change is required: the suite uses stable ids (`#providers`, `#openNetworkPicker`, `data-chain-id`, `#personalSign`, `#signTypedDataV4`, `#signPermitSingle`, `#sendButton`, and `request.html`). Optional future hardening: expose a `data-chain-name` attribute on network items, which would let the add-chain test avoid asserting a wallet-side chain name. That change is not necessary for the current suite.
