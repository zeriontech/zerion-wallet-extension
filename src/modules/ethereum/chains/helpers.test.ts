import { remapPinnedChains, reorderPinnedChains } from './helpers';

test('remapPinnedChains rewrites changed ids in place', () => {
  const idMap = new Map([['zerion-custom-network-0x64', 'xdai']]);
  expect(
    remapPinnedChains(['ethereum', 'zerion-custom-network-0x64', 'base'], idMap)
  ).toEqual(['ethereum', 'xdai', 'base']);
});

test('remapPinnedChains keeps the first position on collisions', () => {
  const idMap = new Map([['zerion-custom-network-0x64', 'xdai']]);
  expect(
    remapPinnedChains(['xdai', 'ethereum', 'zerion-custom-network-0x64'], idMap)
  ).toEqual(['xdai', 'ethereum']);
  expect(
    remapPinnedChains(['zerion-custom-network-0x64', 'ethereum', 'xdai'], idMap)
  ).toEqual(['xdai', 'ethereum']);
});

test('remapPinnedChains leaves missing or unaffected lists untouched', () => {
  const idMap = new Map([['a', 'b']]);
  expect(remapPinnedChains(undefined, idMap)).toBeUndefined();
  const pinned = ['ethereum'];
  expect(remapPinnedChains(pinned, new Map())).toBe(pinned);
});

test('reorderPinnedChains keeps slots of pins that are not shown', () => {
  expect(
    reorderPinnedChains(
      ['ethereum', 'stale-id', 'base', 'solana', 'polygon'],
      ['polygon', 'ethereum', 'base']
    )
  ).toEqual(['polygon', 'stale-id', 'ethereum', 'solana', 'base']);
});

test('reorderPinnedChains appends hidden pins when lists disagree', () => {
  expect(
    reorderPinnedChains(['stale-id', 'ethereum'], ['base', 'ethereum'])
  ).toEqual(['base', 'ethereum', 'stale-id']);
});
