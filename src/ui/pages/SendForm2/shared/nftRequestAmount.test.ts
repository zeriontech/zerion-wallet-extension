import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import { isNftAmountEditable, resolveNftRequestAmount } from './nftRequestAmount';

function nftPosition(standard: 'ERC721' | 'ERC1155', quantity: string): NftPosition {
  return {
    amount: { quantity },
    nft: { interface: standard },
  } as unknown as NftPosition;
}

describe('isNftAmountEditable', () => {
  it.each<[string, NftPosition | null, boolean]>([
    ['no position yet', null, false],
    ['ERC-721', nftPosition('ERC721', '1'), false],
    ['ERC-1155 held once', nftPosition('ERC1155', '1'), false],
    ['ERC-1155 held five times', nftPosition('ERC1155', '5'), true],
  ])('%s', (_name, position, expected) => {
    expect(isNftAmountEditable(position)).toBe(expected);
  });
});

describe('resolveNftRequestAmount', () => {
  const erc721 = nftPosition('ERC721', '1');
  const erc1155 = nftPosition('ERC1155', '5');

  // `null` means no get-send request is sent and the slot stays empty.
  it.each<[string | undefined, string | null, string | null]>([
    [undefined, '1', null],
    ['', '1', null],
    ['0', '1', null],
    ['00', '1', null],
    ['1', '1', '1'],
    ['3', '1', '3'],
    ['03', '1', '3'],
    ['1e3', '1', null],
    ['0x1', '1', null],
    ['1.5', '1', null],
    ['-1', '1', null],
  ])(
    'nftAmount %p: ERC-721 requests %p, ERC-1155 requests %p',
    (nftAmount, forErc721, forErc1155) => {
      expect(resolveNftRequestAmount(nftAmount, isNftAmountEditable(erc721))).toBe(forErc721);
      expect(resolveNftRequestAmount(nftAmount, isNftAmountEditable(erc1155))).toBe(forErc1155);
    },
  );
});
