import BigNumber from 'bignumber.js';
import type { Params } from 'src/modules/zerion-api/requests/transaction-get-send';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { getConfidentialUnderlyingFungibleId } from 'src/ui/features/confidential-balances/confidentialUnderlying';
import { isZeroAmount } from './amount';

// A typed zero is never a max-send. On a zero-balance position (the synthetic
// one built for a token the wallet doesn't hold — the calldata-claim case)
// `0` would otherwise equal the balance and flip the request to `max=true`,
// which the backend answers with an insufficient-balance error instead of a
// valid zero-value transaction.
function isMaxAmount(amount: string, position: FungiblePosition) {
  if (isZeroAmount(amount)) return false;
  try {
    return new BigNumber(amount).eq(position.amount.quantity);
  } catch {
    return false;
  }
}

/** Confidential wrappers always send the exact amount and never custom data: the backend rejects `max` and `data` for them */
export function getSendParams({
  currency,
  chain,
  from,
  to,
  assetId,
  amount,
  isNftMode,
  position,
  data,
}: {
  currency: string;
  chain: string;
  from: string;
  to: string;
  assetId: string;
  amount: string | null;
  isNftMode: boolean;
  position: FungiblePosition | null;
  data: string | undefined;
}): Params {
  const isConfidential =
    getConfidentialUnderlyingFungibleId(
      chain,
      position?.fungible.implementations[chain]?.address
    ) !== undefined;
  const max = Boolean(
    !isNftMode &&
      !isConfidential &&
      amount &&
      position &&
      isMaxAmount(amount, position)
  );
  return {
    currency,
    chain,
    from,
    to,
    assetId,
    amount: max ? undefined : amount ?? undefined,
    max: max ? true : undefined,
    data: isConfidential ? undefined : data,
  };
}
