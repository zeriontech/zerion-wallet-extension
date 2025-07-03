import { PLATFORM } from 'src/env/config';

export const ORIGIN_PROTOCOL =
  PLATFORM === 'firefox' ? 'moz-extension:' : 'chrome-extension:';
