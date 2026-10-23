import { describe, expect, it } from '@jest/globals';
import { TypedDataEncoder, concat, keccak256 } from 'ethers';
import type { TypedDataDocument } from 'src/shared/types/Quote';
import type { IntentEVM } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import { createFakePermits } from 'src/ui/features/confidential-balances/fakePermits';
import type { TypedData } from './TypedData';
import { prepareTypedDataForSigning } from './prepareTypedDataForSigning';

const CANONICAL_DOMAIN = [
  { name: 'name', type: 'string', value: 'USD Coin' },
  { name: 'version', type: 'string', value: '2' },
  { name: 'chainId', type: 'uint256', value: '0x2105' },
  {
    name: 'verifyingContract',
    type: 'address',
    value: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  },
  {
    name: 'salt',
    type: 'bytes32',
    value: `0x${(8453).toString(16).padStart(64, '0')}`,
  },
] as const;

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

const PERMIT_MESSAGE = {
  owner: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
  spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  value: '100000000',
  nonce: 0,
  deadline: '1783515667',
};

/** The EIP-712 digest a signer computes from the `EIP712Domain` it is given */
function digestFromDeclaredDomain(typedData: TypedData) {
  const { EIP712Domain, ...types } = typedData.types;
  const domainSeparator = TypedDataEncoder.from({ EIP712Domain }).hashStruct(
    'EIP712Domain',
    typedData.domain
  );
  const structHash = TypedDataEncoder.from(types).hash(typedData.message);
  return keccak256(concat(['0x1901', domainSeparator, structHash]));
}

const SUBSETS = Array.from(
  { length: 2 ** CANONICAL_DOMAIN.length },
  (_, mask) => CANONICAL_DOMAIN.filter((_field, index) => mask & (1 << index))
);
const ENCODINGS = ['object', 'JSON string'] as const;
const CASES = SUBSETS.flatMap((fields) =>
  ENCODINGS.map(
    (encoding) =>
      [
        fields.map(({ name }) => name).join(', ') || 'none',
        encoding,
        fields,
      ] as const
  )
);

describe('prepareTypedDataForSigning — every domain subset and message encoding', () => {
  it('enumerates all 32 subsets for both encodings', () => {
    expect(CASES).toHaveLength(64);
  });

  it.each(CASES)('domain {%s}, message as %s', (_label, encoding, fields) => {
    const domain = Object.fromEntries(
      fields.map(({ name, value }) => [name, value])
    );
    const document: TypedDataDocument = {
      types: PERMIT_TYPES,
      primaryType: 'Permit',
      domain,
      message:
        encoding === 'object' ? PERMIT_MESSAGE : JSON.stringify(PERMIT_MESSAGE),
    };

    const prepared = prepareTypedDataForSigning(document);

    expect(prepared.types.EIP712Domain).toEqual(
      fields.map(({ name, type }) => ({ name, type }))
    );
    expect(Object.keys(prepared.domain)).toEqual(
      fields.map(({ name }) => name)
    );
    if ('chainId' in domain) {
      expect(prepared.domain.chainId).toBe(8453);
    }
    expect(prepared.message).toEqual(PERMIT_MESSAGE);
    expect(digestFromDeclaredDomain(prepared)).toBe(
      TypedDataEncoder.hash(domain, PERMIT_TYPES, PERMIT_MESSAGE)
    );
  });
});

describe('prepareTypedDataForSigning', () => {
  it('keeps an EIP712Domain entry supplied by the API untouched', () => {
    const supplied = [{ name: 'name', type: 'string' }];
    const result = prepareTypedDataForSigning({
      types: { ...PERMIT_TYPES, EIP712Domain: supplied },
      primaryType: 'Permit',
      domain: { name: 'X' },
      message: PERMIT_MESSAGE,
    });
    expect(result.types.EIP712Domain).toBe(supplied);
  });

  it('does not mutate the input document', () => {
    const document: TypedDataDocument = {
      types: PERMIT_TYPES,
      primaryType: 'Permit',
      domain: { name: 'X', chainId: '1' },
      message: PERMIT_MESSAGE,
    };
    prepareTypedDataForSigning(document);
    expect(document.types).not.toHaveProperty('EIP712Domain');
    expect(document.domain.chainId).toBe('1');
  });
});

/** `toTypedData` from src/ui/features/confidential-balances/toTypedData.ts as it was before WLT-3098 */
function legacyToTypedData(intent: IntentEVM): TypedData {
  const DOMAIN_FIELD_TYPES: Record<keyof IntentEVM['domain'], string> = {
    name: 'string',
    version: 'string',
    chainId: 'uint256',
    verifyingContract: 'address',
    salt: 'bytes32',
  };
  const DOMAIN_FIELD_ORDER: (keyof IntentEVM['domain'])[] = [
    'name',
    'version',
    'chainId',
    'verifyingContract',
    'salt',
  ];
  const domain: Record<string, string | number> = {};
  for (const field of DOMAIN_FIELD_ORDER) {
    const value = intent.domain[field];
    if (value == null) {
      continue;
    }
    domain[field] = field === 'chainId' ? Number(value) : value;
  }
  const types = intent.types.EIP712Domain
    ? intent.types
    : {
        EIP712Domain: DOMAIN_FIELD_ORDER.filter((field) => field in domain).map(
          (field) => ({ name: field, type: DOMAIN_FIELD_TYPES[field] })
        ),
        ...intent.types,
      };
  return {
    domain,
    types,
    primaryType: intent.primaryType,
    message: intent.message,
  };
}

const REVEAL_PERMIT_WITHOUT_DOMAIN_TYPE: IntentEVM = {
  domain: {
    name: 'Zama',
    version: '1',
    chainId: '0x2105',
    verifyingContract: '0x0000000000000000000000000000000000000002',
    salt: null,
  },
  types: { Permit: [{ name: 'publicKey', type: 'bytes' }] },
  primaryType: 'Permit',
  message: { publicKey: '0x01' },
};

describe('prepareTypedDataForSigning — Reveal permits are signed as before', () => {
  const permits: Array<[string, IntentEVM]> = [
    ['a permit without EIP712Domain', REVEAL_PERMIT_WITHOUT_DOMAIN_TYPE],
    ...createFakePermits('0x42b9df65b219b3dd36ff330a4dd8f327a6ada990').map(
      (permit) =>
        [`the ${permit.chain} dev permit`, permit.eip712] as [string, IntentEVM]
    ),
  ];

  it.each(permits)('%s serializes byte-identically', (_label, permit) => {
    expect(JSON.stringify(prepareTypedDataForSigning(permit))).toBe(
      JSON.stringify(legacyToTypedData(permit))
    );
  });
});
