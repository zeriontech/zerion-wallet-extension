import type { Networks } from 'src/modules/networks/Networks';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { getTopNetworks } from './useTopNetworks';

function position(chainId: string): FungiblePosition {
  return {
    chain: { id: chainId, name: chainId, iconUrl: `${chainId}.png` },
  } as FungiblePosition;
}

const networks = {
  getByNetworkId: (chain: { toString(): string }) => {
    const id = chain.toString();
    return { id, name: id, iconUrl: `${id}.png` };
  },
} as unknown as Networks;

const ids = (entries: { chainId: string }[]) => entries.map((e) => e.chainId);

describe('getTopNetworks', () => {
  const positions = [
    position('ethereum'),
    position('ethereum'),
    position('base'),
    position('base'),
    position('base'),
    position('arbitrum'),
  ];

  it('orders by position count without pins', () => {
    expect(ids(getTopNetworks(positions, null, null))).toEqual([
      'base',
      'ethereum',
      'arbitrum',
    ]);
  });

  it('puts pinned chains first in pin order and dedupes them', () => {
    const result = getTopNetworks(positions, null, null, {
      pinnedChainIds: ['arbitrum', 'ethereum'],
    });
    expect(ids(result)).toEqual(['arbitrum', 'ethereum', 'base']);
  });

  it('resolves pinned chains without positions through networks', () => {
    const result = getTopNetworks(positions, null, null, {
      pinnedChainIds: ['optimism'],
      networks,
    });
    expect(ids(result)).toEqual(['optimism', 'base', 'ethereum', 'arbitrum']);
  });

  it('drops pinned chains that cannot be resolved', () => {
    const result = getTopNetworks(positions, null, null, {
      pinnedChainIds: ['optimism'],
    });
    expect(ids(result)).toEqual(['base', 'ethereum', 'arbitrum']);
  });

  it('keeps pinnedFirstChainId ahead of user pins', () => {
    const result = getTopNetworks(positions, null, null, {
      pinnedFirstChainId: 'solana',
      pinnedChainIds: ['solana', 'arbitrum'],
      networks,
    });
    expect(ids(result)).toEqual(['solana', 'arbitrum', 'base', 'ethereum']);
  });
});
