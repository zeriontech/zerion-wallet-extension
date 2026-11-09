/**
 * `src/env/config.ts` asserts these at import time. Tests never talk to the
 * network, so any well-formed value will do; a real `.env` is not loaded by the test runner.
 */
process.env.ZERION_API_URL ??= 'https://zpi.zerion.io/';
process.env.ZERION_TESTNET_API_URL ??= 'https://zpi-testnet.zerion.io/';
process.env.DEFI_SDK_TRANSACTIONS_API_URL ??= 'https://transactions.zerion.io/';
process.env.PROXY_URL ??= 'https://proxy.zerion.io/';
/** Public wallet from e2e/fixtures/constants.ts; any well-formed address works. */
process.env.TEST_WALLET_ADDRESS ??=
  '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1';
/** Solana is on in every shipped build; `Networks` drops Solana chains when it is off */
process.env.FEATURE_SOLANA ??= 'on';
