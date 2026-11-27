import { Networks } from 'src/modules/networks/Networks';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import {
  APPROVE_HASH,
  BRIDGE_HASH,
  MAYAN_FORWARDER,
  USDC_ADDRESS,
  createBroadcastTransaction,
  createFallbackApprove,
  createFallbackBridge,
  interpretedBridgeWithApprove,
} from 'src/modules/ethereum/transactions/addressAction/approveBridge.fixtures';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { getStepAddressActions } from 'src/ui/pages/SwapForm2/shared/getStepAddressActions';
import { mergePendingEntries } from './mergePendingEntries';

// The real client transitively imports the extension runtime, and the http
// client reads package.json, which ESM tests cannot import by name
vi.mock('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { assetListFungibles: vi.fn() },
}));
vi.mock('src/shared/packageVersion', () => ({
  version: 'test',
  productionVersion: 'test',
}));
const { pendingTransactionToAddressAction } =
  await import('src/modules/ethereum/transactions/addressAction/creators');

const networks = new Networks({
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      iconUrl: null,
      specification: { eip155: { chainId: 1 } },
      explorer: null,
    } as unknown as NetworkInfo,
  ],
  ethereumChainConfigs: [],
  visitedChains: [],
});

test('approve + bridge leaves two different local rows in Pending', async () => {
  const { approve, swap } = getStepAddressActions<AnyAddressAction>({
    interpretationAction: interpretedBridgeWithApprove,
    fallbackApproveAction: createFallbackApprove(),
    fallbackSwapAction: createFallbackBridge({ onChain: true }),
  });
  const signedAt = 1759752000000;
  const [approveRow, bridgeRow] = await Promise.all(
    [
      { hash: APPROVE_HASH, nonce: 7, to: USDC_ADDRESS, addressAction: approve },
      { hash: BRIDGE_HASH, nonce: 8, to: MAYAN_FORWARDER, addressAction: swap },
    ].map(async (step, index) => {
      const { addressAction } = await pendingTransactionToAddressAction(
        createBroadcastTransaction({ ...step, timestamp: signedAt + index }),
        async () => networks,
        'usd',
      );
      return addressAction;
    }),
  );

  const entries = mergePendingEntries({
    local: [approveRow, bridgeRow],
    pending: [],
    unsigned: [],
    actions: [],
  });

  expect(entries.map((entry) => entry.kind)).toEqual(['local', 'local']);
  const rows = entries.map((entry) => (entry.kind === 'local' ? entry.action : null));
  expect(rows).toEqual([bridgeRow, approveRow]);
  expect(approveRow.type.value).toBe('approve');
  expect(bridgeRow.type.value).toBe(interpretedBridgeWithApprove.type.value);
  expect(approveRow.label).not.toEqual(bridgeRow.label);
  expect(approveRow.content).not.toEqual(bridgeRow.content);
});
