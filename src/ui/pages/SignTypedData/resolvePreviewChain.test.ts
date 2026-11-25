import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { Networks } from 'src/modules/networks/Networks';
import { getSafeTxDomainChainId, resolvePreviewChain } from './resolvePreviewChain';

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

const SAFE_TX_TYPE = [{ name: 'to', type: 'address' }];

function safeTx(domain: Record<string, unknown>, primaryType = 'SafeTx'): TypedData {
  return {
    types: { SafeTx: SAFE_TX_TYPE, EIP712Domain: [] },
    domain,
    primaryType,
    message: { to: '0x0000000000000000000000000000000000000000' },
  };
}

function permit(): TypedData {
  return {
    types: { Permit: [{ name: 'spender', type: 'address' }], EIP712Domain: [] },
    domain: { chainId: 8453, verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    primaryType: 'Permit',
    message: { spender: '0x0000000000000000000000000000000000000001' },
  };
}

function resolve(typedData: TypedData) {
  return resolvePreviewChain({
    typedData,
    fallbackChain: FALLBACK_CHAIN,
    networks,
  }).toString();
}

describe('resolvePreviewChain', () => {
  test.each([
    ['decimal string chain id', safeTx({ chainId: '8453' }), 'base'],
    ['hex chain id', safeTx({ chainId: '0x2105' }), 'base'],
    ['numeric chain id', safeTx({ chainId: 8453 }), 'base'],
    ['padded chain id', safeTx({ chainId: ' 8453 ' }), 'base'],
    ['non-SafeTx payload with a domain chain id', permit(), 'ethereum'],
    [
      'primaryType is not SafeTx even with a SafeTx type',
      safeTx({ chainId: 8453 }, 'Order'),
      'ethereum',
    ],
    ['types.SafeTx is missing', { ...safeTx({ chainId: 8453 }), types: {} }, 'ethereum'],
    ['chain id is missing', safeTx({}), 'ethereum'],
    ['chain id is blank', safeTx({ chainId: '   ' }), 'ethereum'],
    ['chain id is malformed', safeTx({ chainId: 'not-a-chain' }), 'ethereum'],
    ['chain id has a non-standard prefix', safeTx({ chainId: '0X2105' }), 'ethereum'],
    ['chain id is unsupported', safeTx({ chainId: '999999' }), 'ethereum'],
  ])('%s resolves to %s', (_name, typedData, expected) => {
    expect(resolve(typedData)).toBe(expected);
  });
});

describe('getSafeTxDomainChainId', () => {
  test('normalizes every accepted chain id shape to hex', () => {
    expect(getSafeTxDomainChainId(safeTx({ chainId: '8453' }))).toBe('0x2105');
    expect(getSafeTxDomainChainId(safeTx({ chainId: '0x2105' }))).toBe('0x2105');
    expect(getSafeTxDomainChainId(safeTx({ chainId: 8453 }))).toBe('0x2105');
  });

  test('rejects payloads that are not a canonical SafeTx', () => {
    expect(getSafeTxDomainChainId(permit())).toBeNull();
    expect(getSafeTxDomainChainId(safeTx({}, 'Order'))).toBeNull();
    expect(getSafeTxDomainChainId({ ...safeTx({ chainId: 8453 }), types: {} })).toBeNull();
    expect(getSafeTxDomainChainId(safeTx({ chainId: '   ' }))).toBeNull();
    expect(getSafeTxDomainChainId(safeTx({ chainId: -1 }))).toBeNull();
    expect(getSafeTxDomainChainId(safeTx({ chainId: 1.5 }))).toBeNull();
  });
});
