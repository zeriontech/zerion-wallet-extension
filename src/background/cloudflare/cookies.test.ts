import { describe, expect, it } from 'vite-plus/test';
import type { CookieLike } from './cookies';
import { buildCookieHeader, domainCoversHost, pickFreshestClearance } from './cookies';

const NOW = Date.UTC(2026, 0, 1, 12);

function cookie(overrides: Partial<CookieLike>): CookieLike {
  return {
    name: 'cf_clearance',
    value: 'value',
    domain: 'zpi.zerion.io',
    path: '/',
    ...overrides,
  };
}

describe('domainCoversHost', () => {
  it('matches host-only cookies exactly and domain cookies by suffix', () => {
    expect(domainCoversHost('zpi.zerion.io', 'zpi.zerion.io')).toBe(true);
    expect(domainCoversHost('zpi.zerion.io', '.zerion.io')).toBe(true);
    expect(domainCoversHost('zpi.zerion.io', '.zpi.zerion.io')).toBe(true);
    expect(domainCoversHost('zpi.zerion.io', '.notzerion.io')).toBe(false);
    expect(domainCoversHost('zpi.zerion.io', 'zerion.io')).toBe(false);
  });
});

describe('clearance cookie selection', () => {
  it('picks the freshest unexpired cf_clearance across partitions', () => {
    const older = cookie({ value: 'old-partition', creationDate: 100 });
    const newer = cookie({ value: 'new-partition', creationDate: 300 });
    const expired = cookie({
      value: 'expired',
      creationDate: 500,
      expirationDate: NOW / 1000 - 1,
    });
    expect(pickFreshestClearance([older, newer, expired], 'zpi.zerion.io', NOW)).toBe(newer);
  });

  it('ignores clearance cookies whose domain does not cover the host', () => {
    const wrongHost = cookie({ domain: 'zpi-testnet.zerion.io', creationDate: 200 });
    expect(pickFreshestClearance([wrongHost], 'zpi.zerion.io', NOW)).toBeNull();
  });

  it('builds the full Cookie header, deduplicating by name', () => {
    const header = buildCookieHeader(
      [
        cookie({ value: 'clearance', creationDate: 300 }),
        cookie({ value: 'session-value', name: 'session_id', domain: '.zerion.io' }),
        cookie({ value: 'duplicate', name: 'session_id', domain: '.zerion.io', creationDate: 400 }),
        cookie({ value: 'wrong-host', name: 'other', domain: '.example.com' }),
        cookie({ value: 'expired', name: 'expired', expirationDate: NOW / 1000 - 1 }),
      ],
      'zpi.zerion.io',
      NOW,
    );
    expect(header).toBe('cf_clearance=clearance; session_id=duplicate');
  });

  it('returns null when there is no clearance to attach', () => {
    expect(
      buildCookieHeader([cookie({ value: 'x', name: 'session_id' })], 'zpi.zerion.io', NOW),
    ).toBeNull();
  });
});
