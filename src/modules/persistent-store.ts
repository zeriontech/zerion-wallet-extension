import { Store } from 'store-unit';
import { BrowserStorage } from 'src/background/webapis/storage';

type Options<S> = {
  retrieve: (key: string) => Promise<S | undefined>;
  save: (key: string, value: S) => Promise<void>;
};

export class PersistentStore<T> extends Store<T> {
  static async readSavedState<T>(key: string) {
    return BrowserStorage.get<T>(key);
  }

  protected key: string;
  protected isReady: boolean;
  private readyPromise: Promise<void>;

  public options: Options<T>;
  public defaultOptions: Options<T> = {
    retrieve: <S>(key: string) => PersistentStore.readSavedState<S>(key),
    save: (key, value) => BrowserStorage.set(key, value),
  };

  constructor(initialState: T, key: string, options: Partial<Options<T>> = {}) {
    super(initialState);
    this.key = key;
    this.options = { ...this.defaultOptions, ...options };
    this.isReady = false;
    this.readyPromise = this.restore();
    this.on('change', (state) => {
      // only write to disk after restore so that we're not making
      // a redundant write on each initialization
      if (this.isReady) {
        this.options.save(this.key, state);
      }
    });
  }

  getState() {
    if (!this.isReady) {
      throw new Error('Do not access getState() before checking ready()');
    }
    return super.getState();
  }

  setState(...args: Parameters<Store<T>['setState']>) {
    if (!this.isReady) {
      if (process.env.NODE_ENV === 'development') {
        // Throw only in dev mode in case some production flow depends on
        // setting state sooner. Before this refactoring it was possible, so
        // it shouldn't really break anything
        throw new Error(
          'You are trying to write to a PersistentStore before {ready}'
        );
      }
    }
    return super.setState(...args);
  }

  async restore() {
    const saved = await this.options.retrieve(this.key);
    if (saved) {
      super.setState(saved);
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
