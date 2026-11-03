import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';

export const MAX_TIMEOUT_MS = 2_147_483_647;
export const READY_TICK_MS = 60_000;

export function getNextReadyDelay(
  unsigned: PendingAction[],
  nowMs: number
): number | null {
  let delay: number | null = null;
  for (const item of unsigned) {
    if (
      item.status === 'unsigned' &&
      item.availableAt !== null &&
      item.availableAt > nowMs
    ) {
      const itemDelay = item.availableAt - nowMs;
      delay = delay === null ? itemDelay : Math.min(delay, itemDelay);
    }
  }
  return delay === null ? null : Math.min(delay, MAX_TIMEOUT_MS);
}

export function armReadyClock(
  unsigned: PendingAction[],
  clockMs: number,
  onTick: () => void
): () => void {
  const delay = getNextReadyDelay(unsigned, clockMs);
  if (delay === null) {
    return () => {};
  }
  const id = setTimeout(onTick, Math.max(0, delay - (Date.now() - clockMs)));
  return () => clearTimeout(id);
}

export function watchReadyClock(
  unsigned: PendingAction[],
  onSample: (nowMs: number) => void
): () => void {
  const sampledMs = Date.now();
  onSample(sampledMs);
  if (getNextReadyDelay(unsigned, sampledMs) === null) {
    return () => {};
  }
  const id = setInterval(() => {
    const tickMs = Date.now();
    if (getNextReadyDelay(unsigned, tickMs) === null) {
      clearInterval(id);
      return;
    }
    onSample(tickMs);
  }, READY_TICK_MS);
  return () => clearInterval(id);
}
