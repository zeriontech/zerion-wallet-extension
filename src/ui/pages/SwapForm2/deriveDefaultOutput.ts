import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { ReceiveFungibles } from 'src/modules/zerion-api/requests/asset-get-receive-fungibles';
import { findConfidentialUnderlyingFungibleId } from 'src/ui/features/confidential-balances/confidentialUnderlying';

export const ETH_ID = 'eth';
export const USDC_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDT_ID = '0xdac17f958d2ee523a2206206994597c13d831ec7';

/** A Pay that is a confidential wrapper defaults Receive to its underlying on the same chain, unless the user chose Receive */
export function deriveDefaultOutput({
  inputSupportsTrading,
  inputChain,
  inputFungibleId,
  outputChainId,
  outputFungibleId,
  defaultOutputChain,
  outputBaseAssetId,
  receiveFungibles,
  positions,
}: {
  inputSupportsTrading: boolean;
  inputChain: string;
  inputFungibleId: string;
  outputChainId?: string;
  outputFungibleId?: string;
  defaultOutputChain: string;
  outputBaseAssetId: string | undefined;
  receiveFungibles: ReceiveFungibles | undefined;
  positions: FungiblePosition[];
}): {
  outputChain: string;
  outputFungibleId: string | undefined;
  outputDefaultPending: boolean;
} {
  const underlyingFungibleId =
    outputFungibleId == null &&
    (outputChainId == null || outputChainId === inputChain)
      ? findConfidentialUnderlyingFungibleId(
          positions,
          inputChain,
          inputFungibleId
        )
      : undefined;
  if (underlyingFungibleId) {
    return {
      outputChain: inputChain,
      outputFungibleId: underlyingFungibleId,
      outputDefaultPending: false,
    };
  }

  const outputDefaultPending =
    inputSupportsTrading && !receiveFungibles && outputFungibleId == null;

  const defaultOutputFungibleId = ((): string | undefined => {
    if (!inputSupportsTrading) {
      return ETH_ID;
    }
    if (!receiveFungibles) {
      return undefined;
    }
    const { popular, others } = receiveFungibles;
    for (const fungible of [...popular, ...others]) {
      if (fungible.id !== inputFungibleId) {
        return fungible.id;
      }
    }
    const fallbackList = [outputBaseAssetId, USDC_ID, USDT_ID].filter(
      (id): id is string => Boolean(id)
    );
    for (const id of fallbackList) {
      if (id !== inputFungibleId) {
        return id;
      }
    }
    return USDC_ID;
  })();

  return {
    outputChain: defaultOutputChain,
    outputFungibleId: defaultOutputFungibleId,
    outputDefaultPending,
  };
}
