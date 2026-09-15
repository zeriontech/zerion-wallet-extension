import type { StoredPermit } from 'src/shared/types/ConfidentialPermit';
import {
  collectPermitsForRequest,
  getPermitsFingerprint,
  getValidPermits,
  isPermitValid,
  MAX_PERMITS_PER_REQUEST,
  PERMIT_LIFETIME_MS,
  toStoredPermit,
} from './permits';

const NOW = Date.parse('2026-09-14T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function makePermit(overrides: Partial<StoredPermit> = {}): StoredPermit {
  return {
    address: '0x1111111111111111111111111111111111111111',
    contracts: ['0x2222222222222222222222222222222222222222'],
    expireAt: new Date(NOW + 60 * DAY).toISOString(),
    signature: `0x${'ab'.repeat(65)}`,
    chain: 'ethereum',
    signedAt: NOW,
    ...overrides,
  };
}

describe('isPermitValid', () => {
  test('is valid right after signing', () => {
    expect(isPermitValid(makePermit(), NOW)).toBe(true);
  });

  test('stops at the earlier of expireAt and the 30-day lifetime', () => {
    const soon = makePermit({ expireAt: new Date(NOW + DAY).toISOString() });
    expect(isPermitValid(soon, NOW + DAY - 1)).toBe(true);
    expect(isPermitValid(soon, NOW + DAY)).toBe(false);

    const longLived = makePermit({
      expireAt: new Date(NOW + 365 * DAY).toISOString(),
    });
    expect(isPermitValid(longLived, NOW + PERMIT_LIFETIME_MS - 1)).toBe(true);
    expect(isPermitValid(longLived, NOW + PERMIT_LIFETIME_MS)).toBe(false);
  });

  test('falls back to the lifetime when expireAt is unparseable', () => {
    const odd = makePermit({ expireAt: 'not-a-date' });
    expect(isPermitValid(odd, NOW + PERMIT_LIFETIME_MS - 1)).toBe(true);
    expect(isPermitValid(odd, NOW + PERMIT_LIFETIME_MS)).toBe(false);
  });
});

describe('collectPermitsForRequest', () => {
  test('drops expired permits and strips local-only fields', () => {
    const valid = makePermit();
    const expired = makePermit({ signedAt: NOW - 2 * PERMIT_LIFETIME_MS });
    expect(collectPermitsForRequest([[valid, expired]], NOW)).toEqual([
      {
        address: valid.address,
        contracts: valid.contracts,
        expireAt: valid.expireAt,
        signature: valid.signature,
      },
    ]);
  });

  test('caps at the backend limit in wallet order', () => {
    const many = Array.from({ length: MAX_PERMITS_PER_REQUEST + 3 }, (_, i) =>
      makePermit({ signature: `0x${String(i).padStart(130, '0')}` })
    );
    const result = collectPermitsForRequest([many], NOW);
    expect(result).toHaveLength(MAX_PERMITS_PER_REQUEST);
    expect(result[0].signature).toBe(many[0].signature);
  });

  test('handles missing lists', () => {
    expect(collectPermitsForRequest([undefined, null, []], NOW)).toEqual([]);
    expect(getValidPermits(undefined, NOW)).toEqual([]);
  });
});

describe('getPermitsFingerprint', () => {
  test('is null without permits and changes with the signatures', () => {
    expect(getPermitsFingerprint([])).toBeNull();
    expect(getPermitsFingerprint(undefined)).toBeNull();
    const a = collectPermitsForRequest([[makePermit()]], NOW);
    const b = collectPermitsForRequest(
      [[makePermit({ signature: `0x${'cd'.repeat(65)}` })]],
      NOW
    );
    expect(getPermitsFingerprint(a)).not.toBe(getPermitsFingerprint(b));
    expect(getPermitsFingerprint(a)).toBe(getPermitsFingerprint(a));
  });
});

describe('toStoredPermit', () => {
  test('echoes the permit round-trip data and records the chain', () => {
    const stored = toStoredPermit(
      '0x1111111111111111111111111111111111111111',
      {
        chain: 'base',
        contracts: ['0xabc'],
        expireAt: '2026-10-01T00:00:00.000Z',
        eip712: {
          types: {},
          primaryType: 'X',
          domain: {
            name: null,
            version: null,
            chainId: null,
            verifyingContract: null,
            salt: null,
          },
          message: {},
        },
      },
      '0xsig',
      NOW
    );
    expect(stored).toEqual({
      address: '0x1111111111111111111111111111111111111111',
      contracts: ['0xabc'],
      expireAt: '2026-10-01T00:00:00.000Z',
      signature: '0xsig',
      chain: 'base',
      signedAt: NOW,
    });
  });
});
