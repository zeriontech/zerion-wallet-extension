import { createNanoEvents } from 'nanoevents';

export const emitter = createNanoEvents<{
  dappConnection: ({ url, address }: { url: string; address: string }) => void;
}>();
