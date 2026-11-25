import type { TypedData } from './TypedData';
import { isCanonicalSafeTx, parseSafeTxChainId, parseSafeTxQuantity } from './canonicalSafeTx';

const SAFE_ADDRESS = '0x4a183b7ED67B9E14b3f45Abfb2Cf44ed22c29E54';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const SAFE_TX_FIELDS = [
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'operation', type: 'uint8' },
  { name: 'safeTxGas', type: 'uint256' },
  { name: 'baseGas', type: 'uint256' },
  { name: 'gasPrice', type: 'uint256' },
  { name: 'gasToken', type: 'address' },
  { name: 'refundReceiver', type: 'address' },
  { name: 'nonce', type: 'uint256' },
];

const EIP712_DOMAIN_FIELDS = [
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const CANONICAL_DOMAIN = { chainId: 8453, verifyingContract: SAFE_ADDRESS };

const SAFE_TX_MESSAGE = {
  to: ZERO_ADDRESS,
  value: '0',
  data: '0x',
  operation: 1,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZERO_ADDRESS,
  refundReceiver: ZERO_ADDRESS,
  nonce: '0',
};

const MESSAGE_WITHOUT_NONCE = Object.fromEntries(
  Object.entries(SAFE_TX_MESSAGE).filter(([key]) => key !== 'nonce'),
);

function safeTx({
  primaryType = 'SafeTx',
  domain = CANONICAL_DOMAIN,
  types = { SafeTx: SAFE_TX_FIELDS, EIP712Domain: EIP712_DOMAIN_FIELDS },
  message = SAFE_TX_MESSAGE,
}: {
  primaryType?: string;
  domain?: Record<string, unknown>;
  types?: Record<string, unknown>;
  message?: Record<string, unknown>;
} = {}): TypedData {
  return {
    types: types as TypedData['types'],
    domain: domain as TypedData['domain'],
    primaryType,
    message,
  };
}

describe('isCanonicalSafeTx', () => {
  test.each([
    ['a number chain id', safeTx()],
    ['a decimal string chain id', safeTx({ domain: { ...CANONICAL_DOMAIN, chainId: '8453' } })],
    [
      'a zero-padded hex chain id',
      safeTx({ domain: { ...CANONICAL_DOMAIN, chainId: '0x002105' } }),
    ],
    [
      'domain keys in another order',
      safeTx({ domain: { verifyingContract: SAFE_ADDRESS, chainId: 8453 } }),
    ],
    ['no EIP712Domain type', safeTx({ types: { SafeTx: SAFE_TX_FIELDS } })],
    [
      'hex-encoded message quantities',
      safeTx({
        message: { ...SAFE_TX_MESSAGE, value: '0x0', safeTxGas: '0x00', nonce: '0x1' },
      }),
    ],
    [
      'an uppercase verifying contract address',
      safeTx({
        domain: {
          chainId: 8453,
          verifyingContract: `0x${SAFE_ADDRESS.slice(2).toUpperCase()}`,
        },
      }),
    ],
  ])('accepts %s', (_name, typedData) => {
    expect(isCanonicalSafeTx(typedData)).toBe(true);
  });

  test.each([
    ['a non-SafeTx primaryType', safeTx({ primaryType: 'Order' })],
    ['a missing SafeTx type', safeTx({ types: { EIP712Domain: EIP712_DOMAIN_FIELDS } })],
    ['an extra domain key', safeTx({ domain: { ...CANONICAL_DOMAIN, salt: '0x00' } })],
    ['a missing verifyingContract', safeTx({ domain: { chainId: 8453 } })],
    ['a missing chainId', safeTx({ domain: { verifyingContract: SAFE_ADDRESS } })],
    [
      'a non-address verifying contract',
      safeTx({ domain: { chainId: 8453, verifyingContract: 'not-an-address' } }),
    ],
    [
      'an extra SafeTx field',
      safeTx({
        types: {
          SafeTx: [...SAFE_TX_FIELDS, { name: 'extra', type: 'uint256' }],
          EIP712Domain: EIP712_DOMAIN_FIELDS,
        },
      }),
    ],
    [
      'a missing SafeTx field',
      safeTx({
        types: { SafeTx: SAFE_TX_FIELDS.slice(0, -1), EIP712Domain: EIP712_DOMAIN_FIELDS },
      }),
    ],
    [
      'reordered SafeTx fields',
      safeTx({
        types: { SafeTx: [...SAFE_TX_FIELDS].reverse(), EIP712Domain: EIP712_DOMAIN_FIELDS },
      }),
    ],
    [
      'a wrong SafeTx field type',
      safeTx({
        types: {
          SafeTx: [{ name: 'to', type: 'string' }, ...SAFE_TX_FIELDS.slice(1)],
          EIP712Domain: EIP712_DOMAIN_FIELDS,
        },
      }),
    ],
    [
      'a renamed SafeTx field',
      safeTx({
        types: {
          SafeTx: [{ name: 'recipient', type: 'address' }, ...SAFE_TX_FIELDS.slice(1)],
          EIP712Domain: EIP712_DOMAIN_FIELDS,
        },
      }),
    ],
    [
      'an extra SafeTx field property',
      safeTx({
        types: {
          SafeTx: SAFE_TX_FIELDS.map((field) => ({ ...field, extra: true })),
          EIP712Domain: EIP712_DOMAIN_FIELDS,
        },
      }),
    ],
    ['an empty EIP712Domain type', safeTx({ types: { SafeTx: SAFE_TX_FIELDS, EIP712Domain: [] } })],
    [
      'a reordered EIP712Domain type',
      safeTx({
        types: { SafeTx: SAFE_TX_FIELDS, EIP712Domain: [...EIP712_DOMAIN_FIELDS].reverse() },
      }),
    ],
    [
      'a retyped EIP712Domain field',
      safeTx({
        types: {
          SafeTx: SAFE_TX_FIELDS,
          EIP712Domain: [
            { name: 'chainId', type: 'string' },
            { name: 'verifyingContract', type: 'address' },
          ],
        },
      }),
    ],
    ['a missing message key', safeTx({ message: MESSAGE_WITHOUT_NONCE })],
    ['an extra message key', safeTx({ message: { ...SAFE_TX_MESSAGE, extra: '0' } })],
  ])('rejects %s', (_name, typedData) => {
    expect(isCanonicalSafeTx(typedData)).toBe(false);
  });
});

describe('parseSafeTxQuantity', () => {
  test.each([
    [1, 1n],
    ['1', 1n],
    ['0x1', 1n],
    ['0x01', 1n],
    ['0x0001', 1n],
    [8453, 8453n],
    ['8453', 8453n],
    ['0x2105', 8453n],
    ['0x002105', 8453n],
    [' 42 ', 42n],
    [0, 0n],
    [1n, 1n],
  ])('reads %s', (value, expected) => {
    expect(parseSafeTxQuantity(value)).toBe(expected);
  });

  test.each([-1, 1.5, ' ', '', 'abc', '0X01', '-1', null, undefined, {}, []])(
    'rejects %s',
    (value) => {
      expect(parseSafeTxQuantity(value)).toBeNull();
    },
  );
});

describe('parseSafeTxChainId', () => {
  test.each([
    [1, '0x1'],
    ['1', '0x1'],
    ['0x1', '0x1'],
    ['0x01', '0x1'],
    ['0x0001', '0x1'],
    [8453, '0x2105'],
    ['0x002105', '0x2105'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(parseSafeTxChainId(value)).toBe(expected);
  });

  test.each([0, '0', '0x0', '0x00', ' ', '', 'abc', '0X01', -1, null, undefined])(
    'rejects %s',
    (value) => {
      expect(parseSafeTxChainId(value)).toBeNull();
    },
  );
});
