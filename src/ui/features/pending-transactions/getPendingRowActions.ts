import type { WalletContainer } from 'src/background/Wallet/model/types';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { getPendingStatus } from './getPendingStatus';

export type PendingRowActions = {
  /** Sign in the History row's `actions` slot */
  rowSign: boolean;
  /** Sign on the row's ActionInfo page */
  infoSign: boolean;
  /** Dismiss on the row's ActionInfo page */
  infoDismiss: boolean;
};

const NONE: PendingRowActions = {
  rowSign: false,
  infoSign: false,
  infoDismiss: false,
};

/** Sign is offered on a ready-to-sign row and Dismiss on any unsigned row's ActionInfo, both only for a wallet this extension can sign with. */
export function getPendingRowActions(
  row: PendingAction,
  walletContainer: WalletContainer | null | undefined,
  nowMs: number
): PendingRowActions {
  if (
    !walletContainer ||
    isReadonlyContainer(walletContainer) ||
    row.status !== 'unsigned'
  ) {
    return NONE;
  }
  const readyToSign = getPendingStatus(row, nowMs).kind === 'readyToSign';
  return { rowSign: readyToSign, infoSign: readyToSign, infoDismiss: true };
}
