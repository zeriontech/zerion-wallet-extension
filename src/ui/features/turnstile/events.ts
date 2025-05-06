import { createNanoEvents } from 'nanoevents';

export const emitter = createNanoEvents<{
  openTurnstile: () => void;
  turnstileClosed: () => void;
}>();
