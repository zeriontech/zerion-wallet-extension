import { normalizeChainId } from 'src/shared/normalizeChainId';
import { createChain } from './Chain';
import type { NetworkInfo } from './NetworkInfo';
import { Networks } from './Networks';
import { networksFallbackInfo } from './networks-fallback';

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
  explorer: {
    name: 'etherscan',
    txUrl: 'https://etherscan.io/tx/{HASH}',
    tokenUrl: 'https://etherscan.io/token/{ADDRESS}',
    homeUrl: 'https://etherscan.io',
    addressUrl: 'https://etherscan.io/address/{ADDRESS}',
  },
  baseAsset: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    iconUrl: null,
    implementations: { ethereum: { address: null, decimals: 18 } },
  },
  flags,
  rpcUrl: 'https://rpc.zerion.io/v1/ethereum',
  publicRpcUrl: 'https://ethereum-rpc.publicnode.com',
};

const xdai: NetworkInfo = {
  ...ethereum,
  id: 'xdai',
  name: 'Gnosis Chain',
  specification: { eip155: { chainId: 100 } },
  baseAsset: {
    id: 'xdai',
    name: 'xDAI',
    symbol: 'xDAI',
    iconUrl: null,
    implementations: {
      // a base asset that is itself a token on its own chain
      xdai: {
        address: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
        decimals: 18,
      },
    },
  },
};

const solana: NetworkInfo = {
  ...ethereum,
  id: 'solana',
  name: 'Solana',
  specification: { solana: { genesisHash: 'genesis' } },
  baseAsset: null,
};

const tron: NetworkInfo = {
  ...ethereum,
  id: 'tron',
  name: 'Tron',
  specification: { tron: { chainId: 728126428 } },
};

function create(networks: NetworkInfo[]) {
  return new Networks({
    networks,
    ethereumChainConfigs: [],
    visitedChains: [],
  });
}

test('getChainId normalizes the decimal eip155 chainId to hex', () => {
  expect(Networks.getChainId(ethereum)).toBe('0x1');
  expect(Networks.getChainId(xdai)).toBe('0x64');
  expect(() => Networks.getChainId(solana)).toThrow();
});

test('ecosystem is derived from the specification', () => {
  expect(Networks.getEcosystem(ethereum)).toBe('evm');
  expect(Networks.getEcosystem(solana)).toBe('solana');
  expect(Networks.predicate('evm', ethereum)).toBe(true);
  expect(Networks.predicate('solana', ethereum)).toBe(false);
  expect(Networks.predicate('solana', solana)).toBe(true);
});

test('chains of an unmodelled standard are dropped', () => {
  const networks = create([ethereum, solana, tron]);
  expect(networks.getNetworks().map((n) => n.id)).toEqual([
    'ethereum',
    'solana',
  ]);
});

test('isNativeAddress compares against the base asset implementation on its own chain', () => {
  const networks = create([ethereum, xdai]);
  expect(networks.isNativeAddress(null, normalizeChainId(1))).toBe(true);
  expect(networks.isNativeAddress('0xdead', normalizeChainId(1))).toBe(false);
  expect(
    networks.isNativeAddress(
      '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
      normalizeChainId(100)
    )
  ).toBe(true);
  expect(networks.isNativeAddress(null, normalizeChainId(100))).toBe(false);
});

test('supports() maps the purpose vocabulary onto flags', () => {
  const networks = create([ethereum]);
  const chain = createChain('ethereum');
  expect(networks.supports('trading', chain)).toBe(true);
  expect(networks.supports('bridging', chain)).toBe(false);
  expect(networks.supports('nftPositions', chain)).toBe(false);
  expect(networks.supports('positions', createChain('unknown'))).toBe(false);
});

test('explorer urls come from the explorer templates only', () => {
  const networks = create([ethereum, { ...xdai, explorer: null }]);
  expect(
    networks.getExplorerTxUrlByName(createChain('ethereum'), '0xabc')
  ).toBe('https://etherscan.io/tx/0xabc');
  expect(
    networks.getExplorerTxUrlByName(createChain('xdai'), '0xabc')
  ).toBeUndefined();
  expect(Networks.getExplorerAddressUrl(ethereum, '0xabc')).toBe(
    'https://etherscan.io/address/0xabc'
  );
});

test('rpc url precedence', () => {
  expect(Networks.getNetworkRpcUrlInternal(ethereum)).toBe(ethereum.rpcUrl);
  expect(Networks.getRpcUrlPublic(ethereum)).toBe(ethereum.publicRpcUrl);
  const withUser = { ...ethereum, rpcUrlUser: 'https://my-node.example' };
  expect(Networks.getNetworkRpcUrlInternal(withUser)).toBe(
    'https://my-node.example'
  );
  expect(Networks.getRpcUrlPublic(withUser)).toBe('https://my-node.example');
});

test('the bundled fallback is a valid NetworkInfo list', () => {
  const networks = create(networksFallbackInfo);
  expect(networks.getNetworks().length).toBe(networksFallbackInfo.length);
  expect(networks.getMainnets().length).toBe(networksFallbackInfo.length);
  expect(networks.getNetworkById(normalizeChainId(1)).id).toBe('ethereum');
  expect(networks.isNativeAddress(null, normalizeChainId(1))).toBe(true);
  expect(networks.getByNetworkId(createChain('solana'))).toBeDefined();
  expect(networks.getByNetworkId(createChain('tron'))).toBeUndefined();
});

test('pinned networks keep the user order and skip unresolved ids', () => {
  const networks = new Networks({
    networks: [ethereum, xdai],
    ethereumChainConfigs: [],
    visitedChains: [],
    pinnedChains: ['xdai', 'unknown-chain', 'ethereum'],
  });
  expect(networks.getPinnedNetworks().map((n) => n.id)).toEqual([
    'xdai',
    'ethereum',
  ]);
  expect(networks.isPinned(createChain('xdai'))).toBe(true);
  expect(networks.isPinned(createChain('solana'))).toBe(false);
  expect(create([ethereum]).getPinnedNetworks()).toEqual([]);
});
