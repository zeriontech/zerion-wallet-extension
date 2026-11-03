import { Store } from 'store-unit';

export const hiddenPendingActionsStore = new Store<ReadonlySet<string>>(
  new Set()
);

export function hidePendingAction(pendingActionId: string): void {
  const hidden = hiddenPendingActionsStore.getState();
  if (!hidden.has(pendingActionId)) {
    hiddenPendingActionsStore.setState(new Set([...hidden, pendingActionId]));
  }
}

export function unhidePendingAction(pendingActionId: string): void {
  const hidden = hiddenPendingActionsStore.getState();
  if (hidden.has(pendingActionId)) {
    const next = new Set(hidden);
    next.delete(pendingActionId);
    hiddenPendingActionsStore.setState(next);
  }
}
