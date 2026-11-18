import dotenv from 'dotenv';

dotenv.config();

/**
 * The dapp tests run against the hosted test dapp by default. Set DAPP_URL to
 * point them at a local checkout instead. There is no implicit local server
 * and no checkout step: the URL is the only contract.
 */
const HOSTED_DAPP_URL = 'https://zeriontech.github.io/zerion-test-dapp/';
const configuredDappUrl = process.env.DAPP_URL || HOSTED_DAPP_URL;

{
  const parsedDappUrl = new URL(configuredDappUrl);

  // The extension content script injects on http://localhost/* and
  // http://0.0.0.0/*, but not on http://127.0.0.1/*.
  if (parsedDappUrl.hostname === '127.0.0.1') {
    throw new Error(
      'DAPP_URL points at 127.0.0.1, where the Zerion content script does not inject. Use http://localhost:<port> or an HTTPS URL.',
    );
  }
}

export const DAPP_URL = configuredDappUrl.replace(/\/+$/, '');

export function dappUrl(pathname: string) {
  return new URL(pathname, `${DAPP_URL}/`).toString();
}
