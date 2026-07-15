/**
 * Dapps whose direct RPC requests (eth_call and other passthrough methods)
 * are sent to Zerion RPC instead of public RPC urls, because public urls
 * may rate-limit (429) and break the dapp. Entries are registrable domains;
 * subdomains match, e.g. 'safe.global' matches 'app.safe.global'.
 */
const WHITELISTED_DAPP_DOMAINS = ['safe.global'];

export function isWhitelistedForZerionRpc(origin: string | undefined) {
  if (!origin) {
    return false;
  }
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }
  return WHITELISTED_DAPP_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}
