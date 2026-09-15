import { Store } from 'store-unit';
import type { ConfidentialDecryptTrigger } from 'src/shared/types/confidential-events';

export interface RevealDialogRequest {
  address: string;
  trigger: ConfidentialDecryptTrigger;
}

/**
 * One Reveal Dialog is mounted at the app level so the panel, the Overview
 * masks, the History masks and the asset page can all open it. Set to a
 * request to open; `null` closes.
 */
export const revealDialogStore = new Store<RevealDialogRequest | null>(null);

export function openRevealDialog(request: RevealDialogRequest) {
  revealDialogStore.setState(request);
}

export function closeRevealDialog() {
  revealDialogStore.setState(null);
}
