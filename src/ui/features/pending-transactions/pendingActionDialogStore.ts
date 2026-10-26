import { Store } from 'store-unit';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { PendingSignReviewRequest } from './signPendingAction';

export type PendingActionDialogState =
  | {
      kind: 'review';
      request: PendingSignReviewRequest;
      resolve(confirmed: boolean): void;
    }
  | {
      kind: 'dismiss';
      item: PendingAction;
      message: string;
      wallet: ExternallyOwnedAccount;
      resolve(signature: string | null): void;
      reject(error: unknown): void;
    }
  | { kind: 'error'; title: string; message: string };

/** One host mounted at the app level renders whatever dialog the History Sign and Dismiss flows open */
export const pendingActionDialogStore =
  new Store<PendingActionDialogState | null>(null);

function openDialog<T>(
  signal: AbortSignal,
  onAbortValue: T,
  createState: (
    settle: (value: T) => void,
    fail: (error: unknown) => void
  ) => PendingActionDialogState
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      resolve(onAbortValue);
      return;
    }
    let state: PendingActionDialogState | null = null;
    let settled = false;
    const finish = (complete: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      if (pendingActionDialogStore.getState() === state) {
        pendingActionDialogStore.setState(null);
      }
      complete();
    };
    state = createState(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error))
    );
    pendingActionDialogStore.setState(state);
    signal.addEventListener(
      'abort',
      () => finish(() => resolve(onAbortValue)),
      { once: true }
    );
  });
}

export function openPendingSignReview(
  request: PendingSignReviewRequest,
  signal: AbortSignal
): Promise<boolean> {
  return openDialog<boolean>(signal, false, (resolve) => ({
    kind: 'review',
    request,
    resolve,
  }));
}

export function openPendingDismissConfirm(
  request: {
    item: PendingAction;
    message: string;
    wallet: ExternallyOwnedAccount;
  },
  signal: AbortSignal
): Promise<string | null> {
  return openDialog<string | null>(signal, null, (resolve, reject) => ({
    kind: 'dismiss',
    ...request,
    resolve,
    reject,
  }));
}

export function showPendingActionError(title: string, error: unknown) {
  pendingActionDialogStore.setState({
    kind: 'error',
    title,
    message: error instanceof Error ? error.message : String(error),
  });
}

export function closePendingActionDialog() {
  pendingActionDialogStore.setState(null);
}
