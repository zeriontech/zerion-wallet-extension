import { InvalidParams } from 'src/shared/errors/errors';
import type { TypedData } from './TypedData';
import {
  assertTypedDataValues,
  sanitizeTypedData,
  sanitizeTypedDataRaw,
} from './prepareTypedData';

function createTypedData(chainId?: string | number): TypedData {
  return {
    domain: {
      name: 'USD Coin',
      version: '2',
      ...(chainId === undefined ? null : { chainId }),
      verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: {
      owner: '0xE093d671dA3D42fBf79BC333692a7A5f794EdDFb',
      spender: '0x6a6394f47dd0baf794808f2749c09bd4ee874e70',
      value: '1000000',
      nonce: 5,
      deadline: 1800000000,
    },
  };
}

describe('sanitizeTypedData', () => {
  test('trims whitespace-padded string chainId', () => {
    expect(sanitizeTypedData(createTypedData(' 1')).domain.chainId).toBe('1');
    expect(sanitizeTypedData(createTypedData('1 ')).domain.chainId).toBe('1');
    expect(sanitizeTypedData(createTypedData(' 0x89 ')).domain.chainId).toBe(
      '0x89'
    );
  });

  test('does not mutate the input typedData', () => {
    const typedData = createTypedData(' 1');
    sanitizeTypedData(typedData);
    expect(typedData.domain.chainId).toBe(' 1');
  });

  test('returns well-formed typedData unchanged', () => {
    const asNumber = createTypedData(1);
    expect(sanitizeTypedData(asNumber)).toBe(asNumber);
    const asString = createTypedData('1');
    expect(sanitizeTypedData(asString)).toBe(asString);
    const asHexString = createTypedData('0x1');
    expect(sanitizeTypedData(asHexString)).toBe(asHexString);
    const withoutChainId = createTypedData();
    expect(sanitizeTypedData(withoutChainId)).toBe(withoutChainId);
  });
});

describe('sanitizeTypedDataRaw', () => {
  test('trims whitespace-padded string chainId in a stringified payload', () => {
    const raw = JSON.stringify(createTypedData(' 1'));
    expect(JSON.parse(sanitizeTypedDataRaw(raw)).domain.chainId).toBe('1');
  });

  test('accepts typedData objects', () => {
    const sanitized = sanitizeTypedDataRaw(createTypedData(' 0x89 '));
    expect(JSON.parse(sanitized).domain.chainId).toBe('0x89');
  });

  test('preserves well-formed payloads', () => {
    const typedData = createTypedData(1);
    expect(sanitizeTypedDataRaw(JSON.stringify(typedData))).toBe(
      JSON.stringify(typedData)
    );
    expect(sanitizeTypedDataRaw(typedData)).toBe(JSON.stringify(typedData));
  });

  test('returns malformed payloads unchanged', () => {
    expect(sanitizeTypedDataRaw('not json')).toBe('not json');
    expect(sanitizeTypedDataRaw('{"domain":{}}')).toBe('{"domain":{}}');
    expect(sanitizeTypedDataRaw({ domain: {} })).toBe('{"domain":{}}');
  });
});

/** The DAI Permit payload from the Immunefi report (WLT-2653) */
function createDaiPermit(allowed: unknown): TypedData {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'holder', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'allowed', type: 'bool' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: 'Dai Stablecoin',
      version: '1',
      chainId: 1,
      verifyingContract: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    message: {
      holder: '0x015FccD4ED178d3b3663157718C6aC8B3BFC1Eb7',
      spender: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      nonce: '0',
      expiry: '2000000000',
      allowed,
    },
  };
}

describe('assertTypedDataValues', () => {
  test('accepts JSON booleans in bool fields', () => {
    expect(() => assertTypedDataValues(createDaiPermit(false))).not.toThrow();
    expect(() => assertTypedDataValues(createDaiPermit(true))).not.toThrow();
    expect(() =>
      assertTypedDataValues(JSON.stringify(createDaiPermit(false)))
    ).not.toThrow();
  });

  test('accepts a well-formed permit without EIP712Domain in types', () => {
    expect(() => assertTypedDataValues(createTypedData(1))).not.toThrow();
  });

  test.each([
    ['string "false"', 'false'],
    ['string "true"', 'true'],
    ['number 0', 0],
    ['number 1', 1],
    ['empty string', ''],
    ['null', null],
    ['missing field', undefined],
  ])('rejects %s in a bool field', (_label, allowed) => {
    expect(() => assertTypedDataValues(createDaiPermit(allowed))).toThrow(
      InvalidParams
    );
    expect(() =>
      assertTypedDataValues(JSON.stringify(createDaiPermit(allowed)))
    ).toThrow(/bool/);
  });

  test('rejects non-boolean values in nested structs and bool arrays', () => {
    const nested: TypedData = {
      types: {
        Outer: [
          { name: 'inner', type: 'Inner' },
          { name: 'flags', type: 'bool[]' },
        ],
        Inner: [{ name: 'ok', type: 'bool' }],
      },
      primaryType: 'Outer',
      domain: { name: 'Test', version: '1', chainId: 1 },
      message: { inner: { ok: true }, flags: [true, false] },
    };
    expect(() => assertTypedDataValues(nested)).not.toThrow();
    expect(() =>
      assertTypedDataValues({
        ...nested,
        message: { inner: { ok: 'false' }, flags: [true, false] },
      })
    ).toThrow(InvalidParams);
    expect(() =>
      assertTypedDataValues({
        ...nested,
        message: { inner: { ok: true }, flags: [true, 'false'] },
      })
    ).toThrow(InvalidParams);
  });

  test('rejects values ethers cannot encode for other types', () => {
    const typedData = createTypedData(1);
    expect(() =>
      assertTypedDataValues({
        ...typedData,
        message: { ...typedData.message, spender: 'not-an-address' },
      })
    ).toThrow(InvalidParams);
    expect(() =>
      assertTypedDataValues({
        ...typedData,
        message: { ...typedData.message, value: 'abc' },
      })
    ).toThrow(InvalidParams);
  });

  test('rejects payloads that cannot be parsed', () => {
    expect(() => assertTypedDataValues('not json')).toThrow(InvalidParams);
    expect(() => assertTypedDataValues('{"domain":{}}')).toThrow(InvalidParams);
  });
});
