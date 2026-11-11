import BigNumber from 'bignumber.js';
import { resolveTokenValue } from 'src/ui/components/AmountInput/inputKind';
import { isAmountEntered } from './shared/amount';
import type { SendFormState2 } from './types';

export function exceedsBalance({
  formState,
  inputPrice,
  balanceQuantity,
}: {
  formState: Pick<SendFormState2, 'inputAmount' | 'inputKind' | 'nftId' | 'nftAmount'>;
  inputPrice: number | null;
  balanceQuantity: string | null;
}): boolean {
  if (balanceQuantity == null) {
    return false;
  }
  const amount = formState.nftId
    ? (formState.nftAmount ?? '1')
    : formState.inputAmount &&
      resolveTokenValue(formState.inputAmount, formState.inputKind ?? 'token', inputPrice);
  if (!amount || !isAmountEntered(amount)) {
    return false;
  }
  return new BigNumber(amount).gt(balanceQuantity);
}
