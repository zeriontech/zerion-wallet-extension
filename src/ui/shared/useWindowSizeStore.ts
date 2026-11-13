import memoize from 'src/shared/memoizeOne';
import { debounce } from 'moderndash';
import { Store } from 'src/shared/store/store';
import { useStore } from 'src/shared/store/useStore';

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
    debounce(() => {
      windowSizeStore.setState(createState());
    }, 300),
  );
}

export function useWindowSizeStore() {
  return useStore(windowSizeStore);
}
