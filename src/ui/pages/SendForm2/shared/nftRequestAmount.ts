import BigNumber from 'bignumber.js';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';

const POSITIVE_INTEGER_REGEX = /^\d+$/;

export function isErc721(nftPosition: NftPosition | null): boolean {
  return nftPosition?.nft.interface === 'ERC721';
}

/** True exactly when the NFT amount input is shown: a non-ERC-721 held more than once. */
export function isNftAmountEditable(nftPosition: NftPosition | null): boolean {
  const balanceQuantity = nftPosition?.amount.quantity ?? null;
  return (
    !isErc721(nftPosition) &&
    balanceQuantity != null &&
    new BigNumber(balanceQuantity).isGreaterThan(1)
  );
}

export function isPositiveIntegerAmount(value: string | null | undefined): value is string {
  return Boolean(value && POSITIVE_INTEGER_REGEX.test(value) && /[1-9]/.test(value));
}

/** The get-send amount for an NFT, or null when no request should be sent. */
export function resolveNftRequestAmount(
  nftAmount: string | undefined,
  amountEditable: boolean,
): string | null {
  if (!amountEditable) return '1';
  return isPositiveIntegerAmount(nftAmount) ? new BigNumber(nftAmount).toFixed(0) : null;
}
