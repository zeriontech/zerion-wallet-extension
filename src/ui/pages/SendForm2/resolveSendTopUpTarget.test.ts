import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import { depositPathFor, resolveSendTopUpTarget } from './resolveSendTopUpTarget';

const tokenMode = {
  inputChain: 'ethereum',
  inputFungibleId: 'usdc-fungible-id',
  nftId: undefined,
};
const nftMode = {
  inputChain: 'ethereum',
  inputFungibleId: 'usdc-fungible-id',
  nftId: 'ethereum:0xcontract:1',
};

const cases = [1, 2, 5, 99].flatMap((code) =>
  [null, 0, 1, 7].flatMap((hint) =>
    (['token', 'nft'] as const).flatMap((mode) =>
      ['eth', null].map((baseAssetId) => [code, hint, mode, baseAssetId] as const),
    ),
  ),
);

function expectedTarget(
  code: number,
  hint: number | null,
  mode: 'token' | 'nft',
  baseAssetId: string | null,
) {
  if (hint !== 1) return null;
  if (code === 2) {
    return baseAssetId === 'eth' ? { outputFungibleId: 'eth', outputChain: 'ethereum' } : null;
  }
  if (code === 1 && mode === 'token') {
    return { outputFungibleId: 'usdc-fungible-id', outputChain: 'ethereum' };
  }
  return null;
}

describe('resolveSendTopUpTarget', () => {
  it.each(cases)('code %p, hint %p, %s mode, baseAssetId %p', (code, hint, mode, baseAssetId) => {
    const error: TransactionPrepareError = { code, message: 'm', hint };
    expect(
      resolveSendTopUpTarget({
        error,
        formState: mode === 'token' ? tokenMode : nftMode,
        baseAssetId,
      }),
    ).toEqual(expectedTarget(code, hint, mode, baseAssetId));
  });

  it('returns null without an error', () => {
    expect(
      resolveSendTopUpTarget({
        error: null,
        formState: tokenMode,
        baseAssetId: 'eth',
      }),
    ).toBeNull();
  });

  it.each([1, 2])('returns null for code %i without an input chain', (code) => {
    const error: TransactionPrepareError = { code, message: 'm', hint: 1 };
    expect(
      resolveSendTopUpTarget({
        error,
        formState: { ...tokenMode, inputChain: '' },
        baseAssetId: 'eth',
      }),
    ).toBeNull();
  });
});

describe('depositPathFor', () => {
  it('opens the deposit page without a target', () => {
    expect(depositPathFor(null)).toBe('/deposit');
  });

  it('opens the deposit form with the target asset and chain', () => {
    expect(depositPathFor({ outputFungibleId: 'eth', outputChain: 'ethereum' })).toBe(
      '/deposit/form?outputFungibleId=eth&outputChain=ethereum',
    );
  });
});
