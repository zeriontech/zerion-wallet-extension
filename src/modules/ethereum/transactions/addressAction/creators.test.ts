import { createSeedTransactions } from 'src/background/transactions/devSeedLocalTransactions';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { TransactionObject } from '../types';
import {
  BRIDGE_HASH,
  MAYAN_FORWARDER,
  createBroadcastTransaction,
  interpretedBridgeWithApprove,
} from './approveBridge.fixtures';

// The real client transitively imports the extension runtime, and the http
// client reads package.json, which ESM tests cannot import by name
vi.mock('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { assetListFungibles: vi.fn() },
}));
vi.mock('src/shared/packageVersion', () => ({
  version: 'test',
  productionVersion: 'test',
}));
const { ZerionAPI } = await import('src/modules/zerion-api/zerion-api.client');
const { applyLocalActionContent, buildActionContent, pendingTransactionToAddressAction } =
  await import('./creators');

function network(id: string, chainId: number): NetworkInfo {
  return {
    id,
    name: id,
    iconUrl: null,
    testnet: false,
    specification: { eip155: { chainId } },
    explorer: null,
    baseAsset: {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      iconUrl: null,
      implementations: { [id]: { address: null, decimals: 18 } },
    },
    flags: {
      supportsTrading: true,
      supportsSending: true,
      supportsBridging: true,
      supportsActions: true,
      supportsPositions: true,
      supportsNftPositions: true,
      supportsSponsoredTransactions: false,
      supportsGasPrices: true,
      supportsSimulations: true,
    },
    rpcUrl: `https://rpc.zerion.io/v1/${id}`,
    publicRpcUrl: `https://rpc.zerion.io/v1/${id}`,
  } as NetworkInfo;
}

const networks = new Networks({
  networks: [
    network('ethereum', 1),
    network('base', 8453),
    network('arbitrum', 42161),
    network('optimism', 10),
  ],
  ethereumChainConfigs: [],
  visitedChains: [],
});

const loadNetworkByChainId = async () => networks;
const address = '0x52Fb91492000F2a900a6b75B37D588AB37378e59';

test('building many local actions makes no asset requests', async () => {
  const spy = vi.mocked(ZerionAPI.assetListFungibles);
  const seeded = createSeedTransactions({ address, count: 600 });
  const items = await Promise.all(
    seeded.map((tx) => pendingTransactionToAddressAction(tx, loadNetworkByChainId, 'usd')),
  );
  expect(spy).not.toHaveBeenCalled();
  expect(items).toHaveLength(600);
  // Every seeded item is a send or an approve, so each one needs an asset
  expect(items.every((item) => item.contentRequest != null)).toBe(true);
  expect(items.every((item) => item.addressAction.content == null)).toBe(true);
});

test('a stored interpretation with content needs no asset lookup', async () => {
  const [tx] = createSeedTransactions({ address, count: 2 }).slice(1);
  const content = { transfers: [], approvals: null };
  const withStoredAction: TransactionObject = {
    ...tx,
    addressAction: {
      id: tx.hash as string,
      address,
      timestamp: tx.timestamp,
      status: 'confirmed',
      label: null,
      type: { value: 'send', displayValue: 'Send' },
      refund: null,
      fee: null,
      transaction: null,
      acts: null,
      content,
      rawTransaction: null,
      local: true,
    },
  };
  const { addressAction, contentRequest } = await pendingTransactionToAddressAction(
    withStoredAction,
    loadNetworkByChainId,
    'usd',
  );
  expect(contentRequest).toBeNull();
  expect(addressAction.content).toBe(content);
  // Locally built acts reuse the stored content instead of fetching
  expect(addressAction.acts?.[0].content).toBe(content);
});

test('resolved content fills both the action and its locally built act', async () => {
  const [tx] = createSeedTransactions({ address, count: 2 }).slice(1);
  const { addressAction, contentRequest } = await pendingTransactionToAddressAction(
    tx,
    loadNetworkByChainId,
    'usd',
  );
  if (!contentRequest) {
    throw new Error('Expected a content request');
  }
  const content = buildActionContent(
    contentRequest.transactionAction,
    {
      id: 'usdc',
      asset_code: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      implementations: {},
      price: { value: 1, relative_change_24h: 0, changed_at: 0 },
    } as never,
    'usd',
  );
  const resolved = applyLocalActionContent(addressAction, contentRequest, content);
  expect(resolved.content?.transfers?.[0].fungible?.symbol).toBe('USDC');
  expect(resolved.acts?.[0].content).toBe(resolved.content);
});

test('a stored bridge interpretation is shown unchanged', async () => {
  const { addressAction } = await pendingTransactionToAddressAction(
    createBroadcastTransaction({
      hash: BRIDGE_HASH,
      nonce: 8,
      to: MAYAN_FORWARDER,
      timestamp: 1759752000000,
      addressAction: interpretedBridgeWithApprove,
    }),
    loadNetworkByChainId,
    'usd',
  );
  const shownFields = ['label', 'type', 'acts', 'content', 'fee', 'refund'] as const;
  for (const field of shownFields) {
    expect(addressAction[field]).toEqual(interpretedBridgeWithApprove[field]);
  }
  const { id, transaction, status, timestamp, rawTransaction } = addressAction;
  expect(id).toBe(BRIDGE_HASH);
  expect(transaction?.hash).toBe(BRIDGE_HASH);
  expect(status).toBe('pending');
  expect(timestamp).toBe(1759752000000);
  expect(rawTransaction?.nonce).toBe(8);
});
