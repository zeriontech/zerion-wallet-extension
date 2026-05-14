import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';

export interface SuccessToastState {
  toastId: string;
  text: string;
  /** Optional subtitle, e.g. "may take a few minutes" for deposit/withdraw. */
  subtitle?: string;
}

type StoreEvents = {
  change: () => void;
};

let current: SuccessToastState | null = null;
const emitter = createNanoEvents<StoreEvents>();

export function getCurrentToast(): SuccessToastState | null {
  return current;
}

export function subscribe(listener: () => void): () => void {
  return emitter.on('change', listener);
}

/**
 * Show a success toast. If one is already on screen, it's replaced — the
 * caller's intent is "this thing just succeeded, show it now," not "queue
 * behind whatever was up before."
 */
export function showSuccessToast({
  text,
  subtitle,
}: {
  text: string;
  subtitle?: string;
}): string {
  const toastId = nanoid();
  current = { toastId, text, subtitle };
  emitter.emit('change');
  return toastId;
}

/** Dismiss the toast (called by the rendering component after its hold timer fires). */
export function dismissSuccessToast(toastId?: string) {
  if (toastId && current?.toastId !== toastId) return;
  current = null;
  emitter.emit('change');
}
