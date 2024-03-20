import { Store } from 'store-unit';
import * as browserStorage from 'src/background/webapis/storage';

export class PersistentStore<T> extends Store<T> {
  private key: string;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  static async readSavedState<T>(key: string) {
    return browserStorage.get<T>(key);
  }

  constructor(initialState: T, key: string) {
    super(initialState);
    this.key = key;
    this.isReady = false;
    this.readyPromise = this.restore();
    this.on('change', (state) => {
      // TODO: FIX:
      // only write to disk after restore so that we're not making
      // a redundant write on each initialization
      // if (this.isReady) {
      //   browserStorage.set(this.key, state);
      // }
      browserStorage.set(this.key, state);
    });
  }

  getState() {
    if (!this.isReady) {
      throw new Error('Do not access getState() before checking ready()');
    }
    return super.getState();
  }

  async restore() {
    const saved = await browserStorage.get<T>(this.key);
    if (saved) {
      this.setState(saved);
    }
    this.isReady = true;
  }

  async ready(): Promise<void> {
    return this.isReady ? Promise.resolve() : this.readyPromise;
  }

  async getSavedState() {
    await this.ready();
    return this.getState();
  }
}
