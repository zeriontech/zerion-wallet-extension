/**
 * Cookie selection for the background Cloudflare clearance.
 *
 * Chrome keeps `cf_clearance` partitioned (CHIPS), and a service worker fetch
 * does not send partitioned cookies even with `credentials: 'include'`. We
 * therefore read the cookie through the `cookies` API and attach the full
 * Cookie header with a declarativeNetRequest rule. Nothing here logs values.
 */
export interface CookieLike {
  name: string;
  value: string;
  domain: string;
  path?: string;
  /** Seconds since the epoch. Absent on session cookies. */
  expirationDate?: number;
  /** Seconds since the epoch. Absent when Chrome does not report it. */
  creationDate?: number;
  session?: boolean;
}

export function isCookieExpired(cookie: CookieLike, nowMs: number): boolean {
  return cookie.expirationDate != null && cookie.expirationDate * 1000 <= nowMs;
}

/** RFC 6265 domain matching: host-only cookies match exactly, domain cookies match subdomains. */
export function domainCoversHost(host: string, cookieDomain: string): boolean {
  if (cookieDomain.startsWith('.')) {
    const domain = cookieDomain.slice(1);
    return host === domain || host.endsWith(`.${domain}`);
  }
  return host === cookieDomain;
}

function freshness(cookie: CookieLike): number {
  // Prefer when the cookie was issued. A session cookie has no expiry, so
  // falling back to it directly would make every session cookie "freshest".
  if (cookie.creationDate != null) {
    return cookie.creationDate;
  }
  // Without a creation time prefer the cookie with a known lifetime; never
  // let an unknown cookie outrank every known one.
  return cookie.expirationDate ?? 0;
}

export function pickFreshestClearance(
  cookies: readonly CookieLike[],
  host: string,
  nowMs: number,
): CookieLike | null {
  let freshest: CookieLike | null = null;
  for (const cookie of cookies) {
    if (cookie.name !== 'cf_clearance') continue;
    if (!domainCoversHost(host, cookie.domain)) continue;
    if (isCookieExpired(cookie, nowMs)) continue;
    if (!freshest || freshness(cookie) > freshness(freshest)) {
      freshest = cookie;
    }
  }
  return freshest;
}

/**
 * Builds the Cookie header for one API host, including the clearance and the
 * other cookies (session, cookies common to all requests) ZPI would normally
 * receive. Returns null when there is no usable clearance: the DNR rule must
 * not touch requests that have nothing to add.
 */
export function buildCookieHeader(
  cookies: readonly CookieLike[],
  host: string,
  nowMs: number,
): string | null {
  const clearance = pickFreshestClearance(cookies, host, nowMs);
  if (!clearance) {
    return null;
  }

  // One value per cookie name, freshest first. Two partitions can carry the
  // same name; a Cookie header with duplicate names would be ambiguous.
  const byName = new Map<string, CookieLike>();
  for (const cookie of cookies) {
    if (!domainCoversHost(host, cookie.domain)) continue;
    if (isCookieExpired(cookie, nowMs)) continue;
    if (cookie.name === 'cf_clearance' && cookie !== clearance) continue;
    const existing = byName.get(cookie.name);
    if (!existing || freshness(cookie) > freshness(existing)) {
      byName.set(cookie.name, cookie);
    }
  }
  byName.set(clearance.name, clearance);

  return [...byName.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}
