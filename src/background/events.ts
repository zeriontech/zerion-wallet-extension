import { createNanoEvents } from 'nanoevents';

export const emitter = createNanoEvents<{
  accountsChanged: () => void;
  chainChanged: (chainId: string) => void;
}>();
