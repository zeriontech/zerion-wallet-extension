import { BrowserStorage } from 'src/background/webapis/storage';
import { Store } from 'store-unit';

export enum Loglevel {
  none = 0,
  error = 1,
  info = 2,
}

const loglevelState = new Store<{ level: Loglevel }>({ level: Loglevel.info });

const STORAGE_KEY = 'LOGLEVEL';

BrowserStorage.get<Loglevel>(STORAGE_KEY).then((v) => {
  loglevelState.setState({ level: v ?? Loglevel.info });
});

loglevelState.on('change', (state) => {
  BrowserStorage.set(STORAGE_KEY, state.level);
});

async function setLoglevel(flag: Loglevel) {
  loglevelState.setState({ level: flag });
}

export function logToConsole<M extends 'log' | 'table' | 'group' | 'groupEnd'>(
  level: Loglevel,
  consoleMethod: M,
  ...args: Parameters<(typeof console)[M]>
) {
  if (level & loglevelState.getState().level) {
    console[consoleMethod](...args); // eslint-disable-line no-console
  }
}

export function log(
  level: Loglevel,
  ...args: Parameters<(typeof console)['log']>
) {
  return logToConsole(level, 'log', ...args);
}

export function logTable(
  level: Loglevel,
  ...args: Parameters<(typeof console)['table']>
) {
  return logToConsole(level, 'table', ...args);
}

Object.assign(globalThis, {
  logger: {
    Loglevel,
    setLoglevel,
    logEverything: () => setLoglevel(Loglevel.info),
    logErrorsOnly: () => setLoglevel(Loglevel.error),
    logNothing: () => setLoglevel(Loglevel.none),
  },
});
