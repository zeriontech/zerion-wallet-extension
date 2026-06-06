import { useEffect, useRef, useState } from 'react';
import { isDeviceAccount } from 'src/shared/types/validators';
import {
  subscribeChange,
  subscribeQueueEvent,
  getQueue,
  getQueues,
} from '../store';
import type { QueueEvent, SignStep, ToasterView } from '../types';

export type TerminalKind = 'success' | 'failed';

export interface ActiveStepView {
  toaster?: ToasterView;
}

export interface ToasterSessionState {
  visible: boolean;
  /** 1-based index of step currently being processed within session */
  x: number;
  /** Total step slots that have actually run (or are running) this session */
  n: number;
  /** Step currently shown in the toaster body */
  current: ActiveStepView | null;
  /** Terminal display state, if any. Drives success-dissolve / failed-hold. */
  terminal: TerminalKind | null;
  /** Bumps every time `current` content changes, drives popLayout key */
  contentKey: number;
  /** Session id (bumps every fresh session, used to gate entrance animation) */
  sessionKey: number;
  /** Queue currently rendered by the toaster, used to count successors. */
  activeQueueId: string | null;
  /** Non-hardware queues waiting in line behind the active queue. */
  pendingQueueCount: number;
}

const TERMINAL_HOLD_MS = 3000;
const DISSOLVE_MS = 500;

export function useToasterSession(): ToasterSessionState {
  const [state, setState] = useState<ToasterSessionState>({
    visible: false,
    x: 0,
    n: 0,
    current: null,
    terminal: null,
    contentKey: 0,
    sessionKey: 0,
    activeQueueId: null,
    pendingQueueCount: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Track which queueIds and step indices have been counted toward `n`.
  // We count a step the moment it starts, so user-dismissals/errors that
  // happened don't double-count when the next queue starts.
  const countedRef = useRef<Set<string>>(new Set());

  // Pending dismiss timer — fires after terminal hold + dissolve completes.
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearDismiss() {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    }

    function scheduleDismiss(delay: number) {
      clearDismiss();
      dismissTimerRef.current = setTimeout(() => {
        dismissTimerRef.current = null;
        setState((s) => ({
          ...s,
          visible: false,
          current: null,
          terminal: null,
          x: 0,
          n: 0,
          activeQueueId: null,
          pendingQueueCount: 0,
        }));
        countedRef.current = new Set();
      }, delay);
    }

    function getStepView(queueId: string, stepIndex: number): ActiveStepView {
      const q = getQueue(queueId);
      const step: SignStep | undefined = q?.steps[stepIndex];
      return { toaster: step?.toaster };
    }

    // Count non-hardware queues that haven't started yet (run.state ===
    // 'pending'). The currently-running queue and already-finished queues
    // (briefly still in the array before removeQueue) are excluded — exactly
    // the "waiting to be processed" semantic the counter shows. Hardware
    // queues drive the dedicated dialog, not the toaster, so they don't
    // count.
    function countPendingNonHardware(): number {
      let count = 0;
      for (const q of getQueues()) {
        if (isDeviceAccount(q.options.wallet)) continue;
        if (q.run.state === 'pending') count += 1;
      }
      return count;
    }

    function startOrAdvanceTo(queueId: string, stepIndex: number) {
      // A new step is starting — cancel any pending dismiss from the
      // previous queue's terminal state so it can't fire mid-session and
      // unmount the toaster while this step is running.
      clearDismiss();
      const slotKey = `${queueId}:${stepIndex}`;
      let isNewSlot = false;
      if (!countedRef.current.has(slotKey)) {
        countedRef.current.add(slotKey);
        isNewSlot = true;
      }
      const view = getStepView(queueId, stepIndex);
      const pendingQueueCount = countPendingNonHardware();
      setState((s) => {
        // If the previous session has been closed (visible=false set, terminal
        // still on screen visually but we are starting a new one) — start
        // fresh. We branch based on whether the current `terminal` indicates
        // a session-end that hasn't been dismissed yet.
        if (!s.visible) {
          // Fresh session begins.
          return {
            visible: true,
            x: 1,
            n: 1,
            current: view,
            terminal: null,
            contentKey: s.contentKey + 1,
            sessionKey: s.sessionKey + 1,
            activeQueueId: queueId,
            pendingQueueCount,
          };
        }
        // In-session step transition.
        return {
          ...s,
          current: view,
          terminal: null,
          x: isNewSlot ? s.x + 1 : s.x,
          n: isNewSlot ? s.n + 1 : s.n,
          contentKey: s.contentKey + 1,
          activeQueueId: queueId,
          pendingQueueCount,
        };
      });
    }

    function isLastStepInQueue(queueId: string, stepIndex: number): boolean {
      // True when this is the final step of its queue. Each queue ends its
      // own session; if another queue is already lined up, its step-start
      // will reuse the visible toaster (clearing `terminal` via the setState
      // merge in startOrAdvanceTo) before the dismiss timer fires.
      const queue = getQueue(queueId);
      if (!queue) return true;
      return stepIndex >= queue.steps.length - 1;
    }

    function handleStepEnd(
      queueId: string,
      stepIndex: number,
      kind: 'success' | 'failed' | 'dismissed'
    ) {
      const isLast = isLastStepInQueue(queueId, stepIndex);
      if (isLast) {
        // Session ends. Display terminal state and schedule dismiss.
        if (kind === 'dismissed') {
          // Silent: just dismiss without success/fail badge.
          setState((s) => ({
            ...s,
            visible: false,
            current: null,
            activeQueueId: null,
            pendingQueueCount: 0,
          }));
          countedRef.current = new Set();
          clearDismiss();
          return;
        }
        const terminal: TerminalKind =
          kind === 'success' ? 'success' : 'failed';
        setState((s) => ({ ...s, terminal, contentKey: s.contentKey + 1 }));
        // dissolve plays, then 1s hold, then dismiss
        scheduleDismiss(DISSOLVE_MS + TERMINAL_HOLD_MS);
      } else if (kind === 'failed') {
        // Mid-session failure: the runner aborts the queue on step-error,
        // so no further step-start will arrive. Show failed terminal and
        // auto-dismiss like the last-step path.
        setState((s) => ({
          ...s,
          terminal: 'failed',
          contentKey: s.contentKey + 1,
        }));
        scheduleDismiss(DISSOLVE_MS + TERMINAL_HOLD_MS);
      } else {
        // Mid-session success or user-dismissal: do nothing visible — the
        // next step-start will swap content via popLayout.
      }
    }

    const unsubscribe = subscribeQueueEvent(
      (queueId: string, event: QueueEvent) => {
        // Hardware queues drive the dedicated hardware dialog, not the toaster.
        const q = getQueue(queueId);
        if (q && isDeviceAccount(q.options.wallet)) return;
        switch (event.type) {
          case 'step-start': {
            startOrAdvanceTo(queueId, event.index);
            break;
          }
          case 'step-success': {
            handleStepEnd(queueId, event.index, 'success');
            break;
          }
          case 'step-error': {
            handleStepEnd(queueId, event.index, 'failed');
            break;
          }
          case 'queue-aborted': {
            const kind =
              event.reason === 'user-dismissed' ? 'dismissed' : 'failed';
            handleStepEnd(queueId, event.index, kind);
            break;
          }
          case 'queue-done': {
            // Step-success for the final step already handled this. No-op.
            break;
          }
        }
      }
    );

    const unsubscribeChange = subscribeChange(() => {
      // Refresh the pending counter on every store change — append, remove,
      // and run-state transitions (pending → running → done). Without
      // listening to run-state changes the count would be stuck at the value
      // captured when the active queue's step-start fired, even as queues
      // behind it begin processing.
      setState((s) => {
        const next = countPendingNonHardware();
        if (next === s.pendingQueueCount) return s;
        return { ...s, pendingQueueCount: next };
      });
    });

    return () => {
      unsubscribe();
      unsubscribeChange();
      clearDismiss();
    };
  }, []);

  return state;
}
