import { createNanoEvents } from 'nanoevents';

export interface ScreenViewParams {
  pathname: string;
  previous: string | null;
  address: string | null;
}

export const appEvents = createNanoEvents<{
  dappConnection: (data: { origin: string; address: string }) => void;
  screenView: (data: ScreenViewParams) => void;
}>();
