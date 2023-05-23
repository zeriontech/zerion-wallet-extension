interface CacheItem {
  promise: Promise<unknown>;
  requested: number;
  timestamp: number | null;
  status: 'fulfilled' | 'rejected' | null; // null for in-progress
  rejectedCount: number;
  fulfilledCount: number;
  staleTime: number | ((fulfilledCount: number, item: CacheItem) => number);
  retryTime: number | ((rejectedCount: number, item: CacheItem) => number);
}

interface Options {
  staleTime?: CacheItem['staleTime'];
  retryTime?: CacheItem['retryTime'];
}

export class RequestCache {
  static staleTime = 30000;
  static retryTime = 0;
  private map = new Map<string, CacheItem>();

  private static isStale(item: CacheItem) {
    if (!item.timestamp) {
      return false; // request still in progress, so do not make another one
    }
    if (item.status === 'rejected') {
      const { retryTime: retryTimeOption } = item;
      const retryTime =
        typeof retryTimeOption === 'function'
          ? retryTimeOption(item.rejectedCount, item)
          : retryTimeOption;
      return (item.timestamp || Infinity) + retryTime < Date.now();
    } else {
      const { staleTime: staleTimeOption } = item;
      const staleTime =
        typeof staleTimeOption === 'function'
          ? staleTimeOption(item.fulfilledCount, item)
          : staleTimeOption;
      return (item.timestamp || Infinity) + staleTime < Date.now();
    }
  }

  private handlePromiseSettle(key: string, status: 'fulfilled' | 'rejected') {
    const item = this.map.get(key);
    if (item) {
      item.status = status;
      item.timestamp = Date.now();
      item.rejectedCount += status === 'rejected' ? 1 : 0;
      item.fulfilledCount += status === 'fulfilled' ? 1 : 0;
    }
  }

  private create(
    key: string,
    getter: () => Promise<unknown>,
    { staleTime, retryTime }: Options = {},
    oldItem?: CacheItem
  ): CacheItem {
    const promise = getter();

    promise.then(
      () => this.handlePromiseSettle(key, 'fulfilled'),
      () => this.handlePromiseSettle(key, 'rejected')
    );
    return {
      promise,
      staleTime: staleTime ?? oldItem?.staleTime ?? RequestCache.staleTime,
      retryTime: retryTime ?? oldItem?.retryTime ?? RequestCache.retryTime,
      timestamp: null,
      status: null,
      requested: Date.now(),
      rejectedCount: oldItem?.rejectedCount ?? 0,
      fulfilledCount: oldItem?.fulfilledCount ?? 0,
    };
  }

  async get<T>(
    key: string,
    getter: () => Promise<T>,
    options?: Options
  ): Promise<T> {
    const item = this.map.get(key);
    if (item && !RequestCache.isStale(item)) {
      return item.promise as Promise<T>;
    } else {
      const newEntry = this.create(key, getter, options, item);
      this.map.set(key, newEntry);
      return newEntry.promise as Promise<T>;
    }
  }
}
