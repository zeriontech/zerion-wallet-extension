import { emitter } from './events';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function start(onIdle: () => void) {
  let id: NodeJS.Timeout | undefined = undefined;

  function waitAndNotify() {
    clearTimeout(id);
    id = setTimeout(() => {
      onIdle();
    }, ONE_DAY);
  }

  emitter.on('userActivity', () => {
    waitAndNotify();
  });
}
