import { createNanoEvents } from 'nanoevents';
import type { OrderOutcome } from './followSubmittedOrder';

interface FollowUpRecord {
  /** Null while the first decision is still being read */
  outcome: OrderOutcome | null;
  controller: AbortController;
  active: boolean;
}

type FollowUpEvents = {
  change: (queueId: string, outcome: OrderOutcome | null) => void;
};

const records = new Map<string, FollowUpRecord>();
const emitter = createNanoEvents<FollowUpEvents>();

/** Starts tracking the follow-up of a queue's order, replacing an earlier one */
export function beginFollowUp(queueId: string): AbortSignal {
  records.get(queueId)?.controller.abort();
  const controller = new AbortController();
  records.set(queueId, { outcome: null, controller, active: true });
  emitter.emit('change', queueId, null);
  return controller.signal;
}

export function setFollowUpOutcome(
  queueId: string,
  signal: AbortSignal,
  outcome: OrderOutcome
) {
  const record = records.get(queueId);
  if (!record || record.controller.signal !== signal || signal.aborted) {
    return;
  }
  record.outcome = outcome;
  emitter.emit('change', queueId, outcome);
}

export function endFollowUp(queueId: string, signal: AbortSignal) {
  const record = records.get(queueId);
  if (record && record.controller.signal === signal) {
    record.active = false;
  }
}

export function getFollowUpOutcome(queueId: string): OrderOutcome | null {
  return records.get(queueId)?.outcome ?? null;
}

export function hasFollowUp(queueId: string): boolean {
  return records.has(queueId);
}

export function isFollowUpActive(queueId: string): boolean {
  return records.get(queueId)?.active ?? false;
}

export function cancelFollowUp(queueId: string) {
  const record = records.get(queueId);
  if (!record) return;
  record.controller.abort();
  records.delete(queueId);
}

export function cancelAllFollowUps() {
  for (const queueId of [...records.keys()]) {
    cancelFollowUp(queueId);
  }
}

export function subscribeFollowUp(
  listener: (queueId: string, outcome: OrderOutcome | null) => void
): () => void {
  return emitter.on('change', listener);
}
