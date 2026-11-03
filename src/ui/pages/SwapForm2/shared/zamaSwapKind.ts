import { getConfidentialUnderlyingFungibleId } from 'src/ui/features/confidential-balances/confidentialUnderlying';

export type ZamaSwapKind = 'deposit' | 'withdraw' | null;

/** `withdraw` unshields a wrapper into its underlying, `deposit` shields an underlying into its wrapper */
export function getZamaSwapKind({
  inputChain,
  inputFungibleId,
  inputAddress,
  outputChain,
  outputFungibleId,
  outputAddress,
}: {
  inputChain: string;
  inputFungibleId: string;
  inputAddress: string | null;
  outputChain: string;
  outputFungibleId: string;
  outputAddress: string | null;
}): ZamaSwapKind {
  if (inputChain !== outputChain) {
    return null;
  }
  if (
    getConfidentialUnderlyingFungibleId(inputChain, inputAddress) ===
    outputFungibleId
  ) {
    return 'withdraw';
  }
  if (
    getConfidentialUnderlyingFungibleId(outputChain, outputAddress) ===
    inputFungibleId
  ) {
    return 'deposit';
  }
  return null;
}
