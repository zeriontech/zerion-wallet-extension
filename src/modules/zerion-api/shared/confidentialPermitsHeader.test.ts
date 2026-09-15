import type { SignedPermit } from '../requests/wallet-prepare-permits';
import {
  CONFIDENTIAL_PERMITS_HEADER,
  encodeConfidentialPermitsHeader,
  getConfidentialPermitsHeaders,
} from './confidentialPermitsHeader';

const permit: SignedPermit = {
  address: '0x52fb8c8a8a4f0e7f4a8f0d1e2c3b4a5968778695',
  contracts: ['0xabc', 'not-an-address'],
  expireAt: '2026-09-17T12:00:00.000+02:00',
  signature: `0x${'ab'.repeat(65)}`,
};

function decode(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    )
  );
}

describe('confidentialPermitsHeader', () => {
  test('uses only the base64url alphabet, unpadded', () => {
    const value = encodeConfidentialPermitsHeader([permit]);
    expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('round-trips permits verbatim as an array', () => {
    expect(decode(encodeConfidentialPermitsHeader([permit]))).toEqual([permit]);
    expect(decode(encodeConfidentialPermitsHeader([permit, permit]))).toEqual([
      permit,
      permit,
    ]);
  });

  test('omits the header when there are no permits', () => {
    expect(getConfidentialPermitsHeaders(undefined)).toEqual({});
    expect(getConfidentialPermitsHeaders([])).toEqual({});
  });

  test('sets the header when there are permits', () => {
    expect(getConfidentialPermitsHeaders([permit])).toEqual({
      [CONFIDENTIAL_PERMITS_HEADER]: encodeConfidentialPermitsHeader([permit]),
    });
  });
});
