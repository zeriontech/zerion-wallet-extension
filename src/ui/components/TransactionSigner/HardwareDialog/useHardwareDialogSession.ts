import { useEffect, useRef, useState } from 'react';
import { isDeviceAccount } from 'src/shared/types/validators';
import type { Step, StepStatus } from 'src/ui/components/TransactionStepper';
import { getQueue, subscribeQueueEvent } from '../store';
import type { QueueEvent, SignStep, ToasterView } from '../types';

type QueueTerminal = 'success' | 'failed' | 'aborted' | null;

export interface HardwareDialogSession {
  visible: boolean;
  /** queueId currently driving the dialog, or null. */
  queueId: string | null;
  /** Steps as understood by TransactionStepper (label + status). */
  steps: Step[];
  /** Index of the active step (0-based). */
  activeIndex: number;
  /** Current per-step status used to drive AnimatedIcons phase + title state. */
  activeStatus: StepStatus;
  /** ToasterView for the active step — drives icons + title kind. */
  activeView: ToasterView | null;
  /** Terminal queue state (success / failed / aborted). null while running. */
  terminal: QueueTerminal;
  /** Last error message for terminal=failed. */
  errorMessage: string | null;
}

const STEP_KIND_LABEL: Record<ToasterView['kind'], string> = {
  approve: 'Approve',
  swap: 'Swap',
  bridge: 'Bridge',
  send: 'Send',
};

function getStepLabel(step: SignStep): string {
  if (step.toaster) return STEP_KIND_LABEL[step.toaster.kind];
  return 'Sign';
}

function buildInitialSteps(steps: SignStep[]): Step[] {
  return steps.map((step) => ({
    label: getStepLabel(step),
    status: 'waiting' as StepStatus,
  }));
}

const INITIAL: HardwareDialogSession = {
  visible: false,
  queueId: null,
  steps: [],
  activeIndex: 0,
  activeStatus: 'waiting',
  activeView: null,
  terminal: null,
  errorMessage: null,
};

export function useHardwareDialogSession(): HardwareDialogSession & {
  reset: () => void;
} {
  const [state, setState] = useState<HardwareDialogSession>(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    function getActiveView(
      queueId: string | null,
      index: number
    ): ToasterView | null {
      if (!queueId) return null;
      const q = getQueue(queueId);
      return q?.steps[index]?.toaster ?? null;
    }

    function setStepStatus(index: number, status: StepStatus) {
      setState((s) => {
        if (!s.visible) return s;
        const steps = s.steps.slice();
        if (steps[index]) {
          steps[index] = { ...steps[index], status };
        }
        return {
          ...s,
          steps,
          activeIndex: index,
          activeStatus: status,
          activeView: getActiveView(s.queueId, index) ?? s.activeView,
        };
      });
    }

    return subscribeQueueEvent((queueId: string, event: QueueEvent) => {
      const queue = getQueue(queueId);
      // Only react to hardware queues. The queue may have already been removed
      // by the runner on terminal events — in that case fall back to current
      // session state to stay scoped to the matching queueId.
      if (queue && !isDeviceAccount(queue.options.wallet)) return;
      if (!queue && stateRef.current.queueId !== queueId) return;

      switch (event.type) {
        case 'step-start': {
          const isFresh =
            !stateRef.current.visible || stateRef.current.queueId !== queueId;
          if (isFresh) {
            // Fresh hardware session.
            const steps = queue ? buildInitialSteps(queue.steps) : [];
            setState({
              visible: true,
              queueId,
              steps:
                steps.length > 0
                  ? steps.map((step, i) =>
                      i === event.index ? { ...step, status: 'signing' } : step
                    )
                  : steps,
              activeIndex: event.index,
              activeStatus: 'signing',
              activeView: queue?.steps[event.index]?.toaster ?? null,
              terminal: null,
              errorMessage: null,
            });
          } else {
            setStepStatus(event.index, 'signing');
          }
          break;
        }
        case 'step-signing': {
          setStepStatus(event.index, 'signing');
          break;
        }
        case 'step-pending': {
          setStepStatus(event.index, 'pending');
          break;
        }
        case 'step-success': {
          setStepStatus(event.index, 'confirmed');
          break;
        }
        case 'step-error': {
          setState((s) => {
            if (!s.visible || s.queueId !== queueId) return s;
            const steps = s.steps.slice();
            if (steps[event.index]) {
              steps[event.index] = {
                ...steps[event.index],
                status: 'failed',
              };
            }
            return {
              ...s,
              steps,
              activeIndex: event.index,
              activeStatus: 'failed',
              terminal: 'failed',
              errorMessage: event.error.message,
            };
          });
          break;
        }
        case 'queue-aborted': {
          setState((s) => {
            if (!s.visible || s.queueId !== queueId) return s;
            return { ...s, terminal: 'aborted' };
          });
          break;
        }
        case 'queue-done': {
          setState((s) => {
            if (!s.visible || s.queueId !== queueId) return s;
            return { ...s, terminal: 'success' };
          });
          break;
        }
      }
    });
  }, []);

  const reset = () => setState(INITIAL);

  return { ...state, reset };
}
