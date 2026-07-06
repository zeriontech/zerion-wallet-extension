import type { TypedData } from './TypedData';
import { sanitizeTypedData } from './prepareTypedData';

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
