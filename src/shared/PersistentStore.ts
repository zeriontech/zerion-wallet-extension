import { Store } from 'store-unit';
import { get, set } from 'src/background/webapis/storage';

function remove<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export class PersistentStore<T> extends Store<T> {
  isReady: boolean;
  private pendingReadyStateListeners: Array<() => void>;

  constructor(key: string, initialState: T) {
    super({ ...initialState });
    this.load(key);
    this.isReady = false;
    this.pendingReadyStateListeners = [];
    this.on('change', (state) => set(key, state));
  }

  async load(key: string) {
    const savedValue = await get(key);
    this.isReady = true;
    if (savedValue) {
      this.setState(savedValue as T);
    }
    this.pendingReadyStateListeners.forEach((cb) => cb());
  }

  async ready() {
    return new Promise<void>((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        const listener = () => {
          remove(this.pendingReadyStateListeners, listener);
          resolve();
        };
        this.pendingReadyStateListeners.push(listener);
      }
    });
  }
}
