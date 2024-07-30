import memoize from 'memoize-one';
import throttle from 'lodash/throttle';
import { Store } from 'store-unit';
import { useStore } from '@store-unit/react';

function getWindowSize(): [number, number] {
  if (typeof window === 'undefined') {
    return [1024, 1024];
  }
  return [(window as Window).innerWidth, (window as Window).innerHeight];
}

interface State {
  innerWidth: number;
  innerHeight: number;
  isNarrowView: boolean;
}

const createStateValue = memoize((width: number, height: number): State => {
  return {
    innerWidth: width,
    innerHeight: height,
    isNarrowView: width <= 768,
  };
});

const createState = () => createStateValue(...getWindowSize());

export const windowSizeStore = new Store(createState());

if (typeof window !== 'undefined') {
  window.addEventListener(
    'resize',
    throttle(
      () => {
        windowSizeStore.setState(createState());
      },
      300,
      { trailing: true }
    )
  );
}

export function useWindowSizeStore() {
  return useStore(windowSizeStore);
}
