import * as browserStorage from 'src/background/webapis/storage';
import { Store } from 'store-unit';

export enum Loglevel {
  none = 0,
  error = 1,
  info = 2,
}

const loglevelState = new Store<{ level: Loglevel }>({ level: Loglevel.none });

const STORAGE_KEY = 'LOGLEVEL';

browserStorage.get<Loglevel>(STORAGE_KEY).then((v) => {
  loglevelState.setState({ level: v ?? Loglevel.none });
});

loglevelState.on('change', (state) => {
  browserStorage.set(STORAGE_KEY, state.level);
});

async function setLoglevel(flag: Loglevel) {
  loglevelState.setState({ level: flag });
}

function logToConsole<M extends 'log' | 'table'>(
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
