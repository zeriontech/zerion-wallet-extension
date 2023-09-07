import type { RequestCache } from 'defi-sdk';
import { DataStatus, EntryStore } from 'defi-sdk';
import { memoryCacheRPCPort } from 'src/ui/shared/channels';

type Key = string | number;

export class BackgroundMemoryCache implements RequestCache<EntryStore> {
  map: Map<Key, EntryStore>;

  constructor() {
    this.map = new Map();
  }

  private getChangeHandler(key: Key, entryStore: EntryStore) {
    return (): void => {
      this.safeWriteEntry(key, entryStore);
    };
  }

  private safeWriteEntry(key: Key, entryStore: EntryStore): Promise<void> {
    if (entryStore.getState().status === DataStatus.ok) {
      memoryCacheRPCPort.request('set', { key, value: entryStore.getState() });
    }
    return Promise.resolve();
  }

  get(key: Key): EntryStore | null {
    return this.map.get(key) || null;
  }

  set(key: Key, entryStore: EntryStore) {
    this.map.set(key, entryStore);
    entryStore.on('change', this.getChangeHandler(key, entryStore));
    this.safeWriteEntry(key, entryStore);
  }

  clear() {
    this.map = new Map();
  }

  remove() {
    throw new Error('Not implemented');
  }

  async load(): Promise<void> {
    // console.log('BackgroundMemoryCache delay');
    // await new Promise((r) => setTimeout(r, 5000));
    // console.log('BackgroundMemoryCache delay finished');
    memoryCacheRPCPort.request('getAll').then((cacheObject) => {
      for (const key in cacheObject) {
        const value = cacheObject[key];
        value.isStale = true;
        value.hasSubscribers = false;
        const entryStore = new EntryStore(value);
        entryStore.on('change', this.getChangeHandler(key, entryStore));
        this.map.set(key, entryStore);
      }
    });
  }
}
