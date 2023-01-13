import { Store } from 'store-unit';
import * as browserStorage from 'src/background/webapis/storage';

function remove<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export class PersistentStore<T> extends Store<T> {
  isReady: boolean;
  key: string;
  private pendingReadyStateListeners: Array<() => void>;

  constructor(key: string, initialState: T) {
    super({ ...initialState });
    this.load(key);
    this.key = key;
    this.isReady = false;
    this.pendingReadyStateListeners = [];
    this.on('change', (state) => browserStorage.set(key, state));
  }

  async load(key: string) {
    const savedValue = await browserStorage.get<T>(key);
    this.isReady = true;
    if (savedValue) {
      this.setState(savedValue);
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

  async getSavedState() {
    return this.ready().then(() => this.getState());
  }
}
