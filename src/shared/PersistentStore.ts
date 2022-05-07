import { Store } from 'store-unit';
import { get, set } from 'src/background/webapis/storage';

export class PersistentStore<T> extends Store<T & { ready: boolean }> {
  constructor(key: string, initialState: T) {
    super({ ...initialState, ready: false });
    this.load(key);
    this.on('change', (state) => set(key, state));
  }

  async load(key: string) {
    const savedValue = await get(key);
    if (savedValue) {
      this.setState(savedValue as T & { ready: boolean });
    } else {
      this.setState((state) => ({ ...state, ready: true }));
    }
  }

  async ready() {
    return new Promise<void>((resolve) => {
      if (this.getState().ready) {
        resolve();
      } else {
        const unlisten = this.on('change', (state) => {
          if (state.ready) {
            unlisten();
            resolve();
          }
        });
      }
    });
  }
}
