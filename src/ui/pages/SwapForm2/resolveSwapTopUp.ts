import type { Quote2 } from 'src/shared/types/Quote';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { DepositTarget } from '../SendForm2/resolveSendTopUpTarget';
import type { SwapFormState2 } from './types';

const INSUFFICIENT_INPUT_BALANCE = 1;
const INSUFFICIENT_BASE_ASSET = 2;
const FALLBACK_LABEL = 'Top Up Your Wallet';

function topUpLabel(symbol: string | null | undefined) {
  return symbol ? `Top Up ${symbol}` : FALLBACK_LABEL;
}

export function resolveSwapTopUp({
  quote,
  formState,
  inputSymbol,
  inputNetwork,
}: {
  quote: Quote2 | null;
  formState: SwapFormState2;
  inputSymbol: string | null | undefined;
  inputNetwork: NetworkInfo | null | undefined;
}): { label: string; depositTarget: DepositTarget | null } | null {
  const code = quote?.error?.code;
  if (code === INSUFFICIENT_INPUT_BALANCE) {
    return {
      label: topUpLabel(inputSymbol),
      depositTarget:
        formState.inputChain && formState.inputFungibleId
          ? { outputFungibleId: formState.inputFungibleId, outputChain: formState.inputChain }
          : null,
    };
  }
  if (code === INSUFFICIENT_BASE_ASSET) {
    const baseAsset = inputNetwork?.baseAsset;
    return {
      label: topUpLabel(baseAsset?.symbol),
      depositTarget:
        formState.inputChain && baseAsset?.id
          ? { outputFungibleId: baseAsset.id, outputChain: formState.inputChain }
          : null,
    };
  }
  return null;
}
