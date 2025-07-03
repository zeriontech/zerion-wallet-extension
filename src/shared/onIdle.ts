export function onIdle(callback: () => void) {
  if ('requestIdleCallback' in globalThis) {
    globalThis.requestIdleCallback(callback);
  } else {
    setTimeout(callback);
  }
}
