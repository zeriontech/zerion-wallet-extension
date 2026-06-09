import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';

export type PerpsActivityKind =
  | 'perps-open'
  | 'perps-add'
  | 'perps-close'
  | 'perps-deposit'
  | 'perps-withdraw';

export type PerpsActivityTerminal =
  | { state: 'running' }
  | { state: 'success'; text: string }
  | { state: 'failed'; error: Error };

export interface PerpsActivitySession {
  sessionId: string;
  kind: PerpsActivityKind;
  /** Label of the step currently in progress (or the last running label on terminal). */
  label: string;
  /**
   * Perp coin symbol (e.g. "BTC") when the operation acts on a position. The
   * toaster resolves it to an icon; absent for deposit/withdraw, which show a
   * bare spinner instead of a token icon.
   */
  coin: string | null;
  /** Terminal state — null while running, populated on succeed/fail. */
  terminal: PerpsActivityTerminal;
  /** ms epoch when the session was started; used to age out stale sessions. */
  startedAt: number;
}

type StoreEvents = {
  change: () => void;
};

let session: PerpsActivitySession | null = null;
const emitter = createNanoEvents<StoreEvents>();

/** Auto-dismiss timer (clears the session after success/failed hold). */
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const SUCCESS_HOLD_MS = 3000;
const FAILED_HOLD_MS = 3000;

function clearDismiss() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

function scheduleDismiss(delay: number) {
  clearDismiss();
  dismissTimer = setTimeout(() => {
    dismissTimer = null;
    session = null;
    emitter.emit('change');
  }, delay);
}

export function getSession(): PerpsActivitySession | null {
  return session;
}

export function subscribe(listener: () => void): () => void {
  return emitter.on('change', listener);
}

/**
 * Start a new perps activity session. Replaces any in-flight session — perps
 * flows are mutually exclusive from the user's POV (one trade at a time).
 */
export function start({
  kind,
  label,
  coin = null,
}: {
  kind: PerpsActivityKind;
  label: string;
  coin?: string | null;
}): string {
  clearDismiss();
  const sessionId = nanoid();
  session = {
    sessionId,
    kind,
    label,
    coin,
    terminal: { state: 'running' },
    startedAt: Date.now(),
  };
  emitter.emit('change');
  return sessionId;
}

/** Advance to a new step within the current session. */
export function advance({ label }: { label: string }) {
  if (!session) return;
  if (session.terminal.state !== 'running') return;
  session = { ...session, label };
  emitter.emit('change');
}

/**
 * Mark the session as successful. The store keeps the success state visible
 * for SUCCESS_HOLD_MS before clearing. The `text` argument is reserved for the
 * post-success success toast caller; the pill itself uses its own success
 * label derived from `kind`.
 */
export function succeed({ text }: { text: string }) {
  if (!session) return;
  session = { ...session, terminal: { state: 'success', text } };
  emitter.emit('change');
  scheduleDismiss(SUCCESS_HOLD_MS);
}

/** Mark the session as failed. The store holds the failed state visible for FAILED_HOLD_MS. */
export function fail(error: Error) {
  if (!session) return;
  session = { ...session, terminal: { state: 'failed', error } };
  emitter.emit('change');
  scheduleDismiss(FAILED_HOLD_MS);
}

/** Hard-clear the session (e.g. for test/dev pages). */
export function reset() {
  clearDismiss();
  session = null;
  emitter.emit('change');
}
