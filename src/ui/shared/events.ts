import { createNanoEvents } from 'nanoevents';

export const emitter = createNanoEvents<{
  uiAccountsChanged: () => void;
  hotkeydown: (combination: string) => void;
}>();
