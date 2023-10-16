import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/components/DnaClaim/dnaAddress';

export function isDnaMintAction(action: AnyAddressAction) {
  return (
    normalizeAddress(action.label?.value || '') === DNA_MINT_CONTRACT_ADDRESS
  );
}
