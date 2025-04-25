import { BrowserStorage } from 'src/background/webapis/storage';
import { PersistentStoreBase } from './persistent-store-base';

type Options<S> = {
  retrieve: (key: string) => Promise<S | undefined>;
  save: (key: string, value: S) => Promise<void>;
};

const defaultOptions = {
  retrieve: <S>(key: string) => PersistentStore.readSavedState<S>(key),
  save: (key: string, value: unknown) => BrowserStorage.set(key, value),
};

export class PersistentStore<T> extends PersistentStoreBase<T> {
  static async readSavedState<T>(key: string) {
    return BrowserStorage.get<T>(key);
  }

  constructor(initialState: T, key: string, options: Partial<Options<T>> = {}) {
    super(initialState, key, { ...defaultOptions, ...options });
  }
}
