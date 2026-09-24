import { Networks } from 'src/modules/networks/Networks';
import { networksFallbackInfo } from 'src/modules/networks/networks-fallback';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import { createGroups as createGroupsLegacy } from '../NetworkSelectDialog/createNetworkGroups';
import { createGroups2 } from './createNetworkGroups2';

function create(pinnedChains: string[]) {
  return new Networks({
    networks: networksFallbackInfo,
    ethereumChainConfigs: [],
    visitedChains: [],
    pinnedChains,
  });
}

// Only the keys of `chains` matter for grouping
const chainDistribution = {
  chains: { ethereum: {}, base: {} },
  positionsChainsDistribution: { ethereum: 100, base: 10 },
  totalValue: 110,
} as unknown as ChainDistribution;

const ids = (groups: { key: string; items: { id: string }[] }[]) =>
  Object.fromEntries(groups.map((g) => [g.key, g.items.map((n) => n.id)]));

describe.each([
  ['createGroups2', createGroups2],
  ['createGroups', createGroupsLegacy],
])('%s', (_name, createGroups) => {
  test('pinned networks come first in the user order and appear once', () => {
    const groups = ids(
      createGroups({
        networks: create(['polygon', 'ethereum']),
        standard: 'evm',
        chainDistribution,
        testnetMode: false,
      })
    );
    expect(groups.pinned).toEqual(['polygon', 'ethereum']);
    expect(groups.main).toEqual(['base']);
    expect(groups.other).not.toContain('polygon');
  });

  test('pins never pass the selector filter or the ecosystem', () => {
    const groups = ids(
      createGroups({
        networks: create(['okbchain', 'solana', 'base']),
        standard: 'evm',
        chainDistribution,
        testnetMode: false,
        filterPredicate: (network) => network.flags.supportsTrading,
      })
    );
    expect(groups.pinned).toEqual(['base']);
    expect([...groups.main, ...groups.other]).not.toContain('okbchain');
  });

  test('Zero is not forced to the top of EVM lists', () => {
    const groups = ids(
      createGroups({
        networks: create([]),
        standard: 'evm',
        chainDistribution,
        testnetMode: false,
      })
    );
    expect(groups.pinned).toEqual([]);
    expect(groups.main).toEqual(['ethereum', 'base']);
  });

  test('Solana is preferred in Solana lists, after pins', () => {
    const groups = ids(
      createGroups({
        networks: create([]),
        standard: 'solana',
        chainDistribution,
        testnetMode: false,
      })
    );
    expect(groups.main[0]).toBe('solana');
  });
});
