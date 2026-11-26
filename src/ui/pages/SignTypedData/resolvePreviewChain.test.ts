import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { Networks } from 'src/modules/networks/Networks';
import { resolvePreviewChain } from './resolvePreviewChain';

const flags: NetworkInfo['flags'] = {
  supportsTrading: true,
  supportsSending: true,
  supportsBridging: false,
  supportsActions: true,
  supportsPositions: true,
  supportsNftPositions: false,
  supportsSponsoredTransactions: false,
  supportsGasPrices: true,
  supportsSimulations: true,
};

const ethereum: NetworkInfo = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: null,
  testnet: false,
  specification: { eip155: { chainId: 1 } },
  explorer: null,
  baseAsset: null,
  flags,
  rpcUrl: 'https://rpc.zerion.io/v1/ethereum',
  publicRpcUrl: 'https://ethereum-rpc.publicnode.com',
};

const base: NetworkInfo = {
  ...ethereum,
  id: 'base',
  name: 'Base',
  specification: { eip155: { chainId: 8453 } },
};

const networks = new Networks({
  networks: [ethereum, base],
  ethereumChainConfigs: [],
  visitedChains: [],
});

const FALLBACK_CHAIN = createChain('ethereum');
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
  chainId = 8453,
  primaryType = 'SafeTx',
  fields = SAFE_TX_FIELDS,
  domain = {},
  eip712Domain = EIP712_DOMAIN_FIELDS,
  message = SAFE_TX_MESSAGE,
}: {
  chainId?: unknown;
  primaryType?: string;
  fields?: Array<{ name: string; type: string }>;
  domain?: Record<string, unknown>;
  eip712Domain?: Array<{ name: string; type: string }>;
  message?: Record<string, unknown>;
} = {}): TypedData {
  return {
    types: { SafeTx: fields, EIP712Domain: eip712Domain } as TypedData['types'],
    domain: { chainId, verifyingContract: SAFE_ADDRESS, ...domain } as TypedData['domain'],
    primaryType,
    message,
  };
}

function permit(chainId: string | number = 8453): TypedData {
  return {
    types: { Permit: [{ name: 'spender', type: 'address' }], EIP712Domain: [] },
    domain: {
      chainId,
      verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    } as TypedData['domain'],
    primaryType: 'Permit',
    message: { spender: '0x0000000000000000000000000000000000000001' },
  };
}

function resolve(typedData: TypedData) {
  return resolvePreviewChain({
    typedData,
    fallbackChain: FALLBACK_CHAIN,
    networks,
  }).chain.toString();
}

describe('resolvePreviewChain', () => {
  test.each([
    ['decimal string chain id', safeTx({ chainId: '8453' }), 'base'],
    ['hex chain id', safeTx({ chainId: '0x2105' }), 'base'],
    ['zero-padded hex chain id', safeTx({ chainId: '0x002105' }), 'base'],
    ['numeric chain id', safeTx({ chainId: 8453 }), 'base'],
    ['padded chain id', safeTx({ chainId: ' 8453 ' }), 'base'],
    [
      'hex-encoded message quantities',
      safeTx({ message: { ...SAFE_TX_MESSAGE, value: '0x0' } }),
      'base',
    ],
    ['non-SafeTx payload with a domain chain id', permit(), 'ethereum'],
    ['non-SafeTx payload with a hex domain chain id', permit('0x2105'), 'ethereum'],
    [
      'primaryType is not SafeTx even with a SafeTx type',
      safeTx({ chainId: 8453, primaryType: 'Order' }),
      'ethereum',
    ],
    ['types.SafeTx is missing', { ...safeTx(), types: {} }, 'ethereum'],
    ['an extra domain key', safeTx({ domain: { salt: '0x00' } }), 'ethereum'],
    [
      'a missing verifyingContract',
      safeTx({ domain: { verifyingContract: undefined } }),
      'ethereum',
    ],
    [
      'a non-address verifyingContract',
      safeTx({ domain: { verifyingContract: 'not-an-address' } }),
      'ethereum',
    ],
    ['reordered SafeTx fields', safeTx({ fields: [...SAFE_TX_FIELDS].reverse() }), 'ethereum'],
    [
      'a wrong SafeTx field type',
      safeTx({ fields: [{ name: 'to', type: 'string' }, ...SAFE_TX_FIELDS.slice(1)] }),
      'ethereum',
    ],
    [
      'an extra SafeTx field',
      safeTx({ fields: [...SAFE_TX_FIELDS, { name: 'extra', type: 'uint256' }] }),
      'ethereum',
    ],
    ['an empty EIP712Domain type', safeTx({ eip712Domain: [] }), 'ethereum'],
    [
      'a retyped EIP712Domain field',
      safeTx({
        eip712Domain: [
          { name: 'chainId', type: 'string' },
          { name: 'verifyingContract', type: 'address' },
        ],
      }),
      'ethereum',
    ],
    ['a missing message key', safeTx({ message: MESSAGE_WITHOUT_NONCE }), 'ethereum'],
    ['an extra message key', safeTx({ message: { ...SAFE_TX_MESSAGE, extra: '0' } }), 'ethereum'],
    ['chain id is missing', safeTx({ domain: { chainId: undefined } }), 'ethereum'],
    ['chain id is blank', safeTx({ chainId: '   ' }), 'ethereum'],
    ['chain id is zero', safeTx({ chainId: 0 }), 'ethereum'],
    ['hex chain id is zero', safeTx({ chainId: '0x0' }), 'ethereum'],
    ['chain id is malformed', safeTx({ chainId: 'not-a-chain' }), 'ethereum'],
    ['chain id has a non-standard prefix', safeTx({ chainId: '0X2105' }), 'ethereum'],
    ['chain id is unsupported', safeTx({ chainId: '999999' }), 'ethereum'],
    ['padded hex chain id is unsupported', safeTx({ chainId: '0x000f423f' }), 'ethereum'],
  ])('%s resolves to %s', (_name, typedData, expected) => {
    expect(resolve(typedData)).toBe(expected);
  });

  test.each([1, '1', '0x1', '0x01', '0x0001'])(
    'chain id %s resolves to the same network as the canonical form',
    (chainId) => {
      expect(
        resolvePreviewChain({
          typedData: safeTx({ chainId }),
          fallbackChain: createChain('base'),
          networks,
        }).chain.toString(),
      ).toBe('ethereum');
    },
  );

  test.each([
    ['a canonical domain chain', safeTx({ chainId: '0x002105' }), 'domain', 'base'],
    [
      'a canonical domain chain equal to the fallback chain',
      safeTx({ chainId: 1 }),
      'domain',
      'ethereum',
    ],
    ['a missing domain chain', safeTx({ domain: { chainId: undefined } }), 'fallback', 'ethereum'],
    ['a zero domain chain', safeTx({ chainId: 0 }), 'fallback', 'ethereum'],
    ['an unsupported domain chain', safeTx({ chainId: '999999' }), 'fallback', 'ethereum'],
    ['a non-Safe payload with a domain chain', permit(), 'fallback', 'ethereum'],
    ['a lookalike SafeTx', safeTx({ domain: { salt: '0x00' } }), 'fallback', 'ethereum'],
  ])('%s reports %s provenance', (_name, typedData, source, chain) => {
    const result = resolvePreviewChain({
      typedData,
      fallbackChain: FALLBACK_CHAIN,
      networks,
    });
    expect(result.source).toBe(source);
    expect(result.chain.toString()).toBe(chain);
  });
});
