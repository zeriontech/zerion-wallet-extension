import { exceedsBalance } from './exceedsBalance';

const PRICE = 2000;

describe('exceedsBalance', () => {
  describe('token mode, balance 1.5', () => {
    it.each([
      ['1.2', false],
      ['1.5', false],
      ['1.50', false],
      ['1.6', true],
      ['0', false],
      [undefined, false],
    ])('amount %p → %p', (inputAmount, expected) => {
      expect(
        exceedsBalance({
          formState: { inputAmount, inputKind: 'token' },
          inputPrice: PRICE,
          balanceQuantity: '1.5',
        }),
      ).toBe(expected);
    });
  });

  describe('USD mode at $2000 per token, balance 1.5 ($3000)', () => {
    it.each([
      ['2400', false],
      ['3000', false],
      ['3000.01', true],
      ['0', false],
      [undefined, false],
    ])('amount $%p → %p', (inputAmount, expected) => {
      expect(
        exceedsBalance({
          formState: { inputAmount, inputKind: 'currency' },
          inputPrice: PRICE,
          balanceQuantity: '1.5',
        }),
      ).toBe(expected);
    });
  });

  describe('NFT ERC-721, balance 1', () => {
    it.each([
      ['1', false],
      [undefined, false],
      ['2', true],
      ['0', false],
    ])('nftAmount %p → %p', (nftAmount, expected) => {
      expect(
        exceedsBalance({
          formState: { nftId: 'ethereum:0xc:1', nftAmount },
          inputPrice: null,
          balanceQuantity: '1',
        }),
      ).toBe(expected);
    });
  });

  describe('NFT ERC-1155, balance 5', () => {
    it.each([
      ['3', false],
      ['5', false],
      ['6', true],
      ['0', false],
    ])('nftAmount %p → %p', (nftAmount, expected) => {
      expect(
        exceedsBalance({
          formState: { nftId: 'ethereum:0xc:7', nftAmount },
          inputPrice: null,
          balanceQuantity: '5',
        }),
      ).toBe(expected);
    });
  });

  it('ignores the token amount in NFT mode', () => {
    expect(
      exceedsBalance({
        formState: {
          nftId: 'ethereum:0xc:1',
          nftAmount: '1',
          inputAmount: '9',
        },
        inputPrice: null,
        balanceQuantity: '1',
      }),
    ).toBe(false);
  });

  it('does not gate an unknown balance', () => {
    expect(
      exceedsBalance({
        formState: { inputAmount: '100' },
        inputPrice: PRICE,
        balanceQuantity: null,
      }),
    ).toBe(false);
  });
});
