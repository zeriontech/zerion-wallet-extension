import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('focus', callback);
  window.addEventListener('blur', callback);
  return () => {
    window.removeEventListener('focus', callback);
    window.removeEventListener('blur', callback);
  };
}

function getSnapshot() {
  return document.hasFocus();
}

export function useWindowFocus() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
