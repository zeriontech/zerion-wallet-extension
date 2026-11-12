import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { isAmountEntered } from '../shared/amount';
import { isPositiveIntegerAmount } from '../shared/nftRequestAmount';
import type { SendFormState2 } from '../types';
import type { SendSlotButton } from '../resolveSendSlot';

interface ResolveSendButtonInput {
  formState: SendFormState2;
  transaction: MultichainTransaction | null;
  state: 'idle' | 'simulating';
  simulated: boolean;
  signing: boolean;
  isPreparingTransaction: boolean;
  slotButton: SendSlotButton;
  exceedsBalance: boolean;
}

function hasNoAmount(formState: SendFormState2) {
  if (formState.nftId) {
    return !isPositiveIntegerAmount(formState.nftAmount);
  }
  // Token mode accepts a typed `0` — non-payable calls (claims, approvals)
  // need it. Only an untouched (or not-yet-numeric) input is "no amount".
  return !isAmountEntered(formState.inputAmount);
}

function resolveLabel({
  formState,
  transaction,
  state,
  simulated,
  isPreparingTransaction,
  exceedsBalance,
}: ResolveSendButtonInput): string {
  if (state === 'simulating') return 'Verifying Transaction';
  if (simulated) return 'Confirm Send';
  if (!formState.inputFungibleId && !formState.nftId) return 'Select Token';
  if (hasNoAmount(formState)) return 'Enter an Amount';
  if (exceedsBalance) return 'Insufficient balance';
  if (isPreparingTransaction && !transaction) return 'Preparing Transaction';
  return 'Send Now';
}

function isDisabled({
  formState,
  transaction,
  state,
  simulated,
  signing,
  slotButton,
  exceedsBalance,
}: ResolveSendButtonInput) {
  if (signing) return true;
  if (state === 'simulating') return true;
  if (simulated) return false;
  if (!formState.inputFungibleId && !formState.nftId) return true;
  if (hasNoAmount(formState)) return true;
  if (exceedsBalance) return true;
  if (slotButton === 'send-disabled') return true;
  if (!transaction) return true;
  return false;
}

export function resolveSendButton(input: ResolveSendButtonInput): {
  label: string;
  disabled: boolean;
} {
  return { label: resolveLabel(input), disabled: isDisabled(input) };
}
