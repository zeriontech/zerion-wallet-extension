import {
  type NotifyEventType,
  type DehydratedState,
  type QueryClient,
  type QueryKey,
  defaultShouldDehydrateQuery,
  dehydrate,
  hashQueryKey,
  hydrate,
} from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { sessionCacheService } from '../channels';

interface PersistedClient {
  timestamp: number;
  /** A unique string that can be used to forcefully
   * invalidate existing caches if they do not share the same buster string */
  buster: string;
  clientState: DehydratedState;
}

const key = 'queryClient-cache-v1';

/** Can be substituted for localStorage */
const storage = {
  async save(persistedClient: PersistedClient) {
    return sessionCacheService.request('setItem', {
      key,
      value: persistedClient,
    });
  },
  async read(): Promise<PersistedClient | null> {
    const entry = await sessionCacheService.request('getItem', { key });
    return entry?.value as PersistedClient;
  },
  async remove() {
    await sessionCacheService.request('removeItem', { key });
  },
};

async function restore({
  buster,
  maxAge,
}: {
  buster: string;
  maxAge: number;
}): Promise<PersistedClient | null> {
  const maybeClient = await storage.read();
  if (maybeClient) {
    if (!maybeClient.timestamp) {
      storage.remove();
    } else if (Date.now() - maybeClient.timestamp > maxAge) {
      storage.remove();
    } else if (buster !== maybeClient.buster) {
      storage.remove();
    } else {
      return maybeClient;
    }
  }
  return null;
}

const queryKeysToPersist = new Set<string>();

/** Marks queryKey as a candidate for persistence */
export function persistentQuery<T extends QueryKey>(queryKey: T): T {
  queryKeysToPersist.add(hashQueryKey(queryKey));
  return queryKey;
}

function handleQueryCacheUpdate(queryClient: QueryClient, buster: string) {
  const clientState = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) => {
      if (queryKeysToPersist.has(query.queryHash)) {
        return defaultShouldDehydrateQuery(query);
      } else {
        return false;
      }
    },
    dehydrateMutations: false,
  });
  const persistedClient: PersistedClient = {
    buster,
    timestamp: Date.now(),
    clientState,
  };
  storage.save(persistedClient);
}

/**
 * Checks if emitted event is about cache change and not about observers.
 * Useful for persist, where we only want to trigger save when cache is changed.
 */
const cacheEventTypes: Set<NotifyEventType> = new Set([
  'added',
  'removed',
  'updated',
]);

function isCacheEventType(eventType: NotifyEventType) {
  return cacheEventTypes.has(eventType);
}

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

/**
 * Query persistence is opt-in. Only queries marked
 * with {persistentQuery(key)} call will be persisted.
 */
export async function persistQueryClient(
  queryClient: QueryClient,
  /** If persisted value is older than maxAge, it will be discarded */
  maxAge = ONE_WEEK
) {
  const buildHash = document.location.pathname.match(/(\w+)\.html$/)?.[1];
  if (!buildHash) {
    // eslint-disable-next-line no-console
    console.warn('Build hash not fount. QueryClient persistence is disabled.');
    return;
  }

  const persistedClient = await restore({ buster: buildHash, maxAge });
  if (persistedClient) {
    /** All queries found in persistent state must be marked as candidates for persistence */
    persistedClient.clientState.queries.forEach((query) => {
      persistentQuery(query.queryKey);
    });
    hydrate(queryClient, persistedClient.clientState);
  }

  const throttledhandleQueryCacheUpdate = throttle(
    handleQueryCacheUpdate,
    800,
    { trailing: true }
  );
  queryClient.getQueryCache().subscribe((event) => {
    if (isCacheEventType(event.type)) {
      throttledhandleQueryCacheUpdate(queryClient, buildHash);
    }
  });
}
