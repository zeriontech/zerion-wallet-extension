import dotenv from 'dotenv';

dotenv.config();

/**
 * The dapp suite is pointed at one explicit URL. There is no implicit local
 * server and no checkout: the dev, user, or CI must provide DAPP_URL.
 *
 * When DAPP_URL is unset the dapp tests are skipped by e2e/dapp/test.ts, so
 * the regular extension suite can still run without a dapp.
 */
const configuredDappUrl = process.env.DAPP_URL;

if (configuredDappUrl) {
  const parsedDappUrl = new URL(configuredDappUrl);

  // The extension content script injects on http://localhost/* and
  // http://0.0.0.0/*, but not on http://127.0.0.1/*.
  if (parsedDappUrl.hostname === '127.0.0.1') {
    throw new Error(
      'DAPP_URL points at 127.0.0.1, where the Zerion content script does not inject. Use http://localhost:<port> or an HTTPS URL.',
    );
  }
}

export const DAPP_URL = configuredDappUrl?.replace(/\/+$/, '') ?? '';

export function dappUrl(pathname: string) {
  if (!DAPP_URL) {
    throw new Error('DAPP_URL is required to run the dapp tests. See docs/dapp-e2e.md.');
  }
  return new URL(pathname, `${DAPP_URL}/`).toString();
}
