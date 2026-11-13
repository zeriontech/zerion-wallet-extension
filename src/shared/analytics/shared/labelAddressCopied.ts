import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { LabelAddressCopiedParams, LabelCopyScreen } from 'src/shared/types/label-events';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function getLabelAddressCopiedParams({
  label,
  chain,
  actType,
  screen,
  isOwnWallet,
}: {
  label: ActionLabel;
  chain: string | null;
  actType: string;
  screen: LabelCopyScreen;
  isOwnWallet: boolean;
}): LabelAddressCopiedParams | null {
  if (!label.wallet || label.wallet.trackable === true || isOwnWallet) {
    return null;
  }
  return {
    address: normalizeAddress(label.wallet.address),
    chain,
    label_title: label.title ?? null,
    act_type: actType,
    screen,
    platform: 'extension',
  };
}
