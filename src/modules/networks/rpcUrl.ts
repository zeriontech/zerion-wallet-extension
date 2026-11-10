const PROXIED_RPC_ORIGINS = new Set(['https://rpc.zerion.io']);

/**
 * E2E builds route Zerion RPC traffic through the local proxy, which adds the
 * Cloudflare bypass header outside Chromium. Production builds leave the URL
 * untouched because `RPC_PROXY_URL` is not set.
 */
export function maybeProxyRpcUrl(url: string, proxyBase: string | null | undefined): string {
  if (!proxyBase) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (!PROXIED_RPC_ORIGINS.has(parsed.origin)) {
      return url;
    }
    return `${proxyBase.replace(/\/$/, '')}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
