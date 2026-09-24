import type { Asset } from 'src/defi-sdk.types';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { fungibleToAsset } from 'src/modules/zerion-api/requests/wallet-get-positions';
import { normalizeAddress } from 'src/shared/normalizeAddress';

type NativeAssetQuery = {
  isNative: true;
  id: string | null;
  address: string | null;
  currency: string;
};

type NonNativeAssetQuery = {
  isNative: false;
  id?: undefined;
  address: string | null;
  currency: string;
};

export type AssetQuery = NativeAssetQuery | NonNativeAssetQuery;

function normalizeNullableAddress(address: string | null) {
  return address != null ? normalizeAddress(address) : null;
}

/**
 * Native assets are addressed by their fungible id; everything else by the
 * contract address, which is the fungible id for most ERC-20s.
 */
export function getAssetQueryFungibleId({ isNative, id, address }: AssetQuery) {
  return isNative ? id : normalizeNullableAddress(address);
}

function matchesFungibleId(fungible: Fungible, fungibleId: string) {
  return (
    fungible.id === fungibleId ||
    Object.values(fungible.implementations || {}).some(
      (impl) => normalizeNullableAddress(impl.address) === fungibleId
    )
  );
}

/**
 * Lookups requested within the same tick are merged into one
 * asset/list-fungibles request per (source, currency), so rendering many
 * local actions at once costs a handful of requests rather than one each.
 */
const MAX_IDS_PER_REQUEST = 50;

type Waiter = {
  resolve: (value: Fungible | null) => void;
  reject: (error: unknown) => void;
};

type Batch = {
  source: NetworksSource;
  currency: string;
  waiters: Map<string, Waiter[]>;
};

const batches = new Map<string, Batch>();
let flushScheduled = false;

function requestChunk(batch: Batch, fungibleIds: string[]) {
  ZerionAPI.assetListFungibles(
    { fungibleIds, currency: batch.currency },
    { source: batch.source }
  ).then(
    (response) => {
      for (const fungibleId of fungibleIds) {
        const fungible =
          response.data.find((item) => matchesFungibleId(item, fungibleId)) ??
          null;
        batch.waiters.get(fungibleId)?.forEach(({ resolve }) => {
          resolve(fungible);
        });
      }
    },
    (error) => {
      for (const fungibleId of fungibleIds) {
        batch.waiters.get(fungibleId)?.forEach(({ reject }) => reject(error));
      }
    }
  );
}

function flush() {
  flushScheduled = false;
  const pending = Array.from(batches.values());
  batches.clear();
  for (const batch of pending) {
    const fungibleIds = Array.from(batch.waiters.keys());
    for (let i = 0; i < fungibleIds.length; i += MAX_IDS_PER_REQUEST) {
      requestChunk(batch, fungibleIds.slice(i, i + MAX_IDS_PER_REQUEST));
    }
  }
}

function loadFungible(
  fungibleId: string,
  currency: string,
  source: NetworksSource
) {
  return new Promise<Fungible | null>((resolve, reject) => {
    const key = `${source}:${currency}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { source, currency, waiters: new Map() };
      batches.set(key, batch);
    }
    const waiters = batch.waiters.get(fungibleId) ?? [];
    waiters.push({ resolve, reject });
    batch.waiters.set(fungibleId, waiters);
    if (!flushScheduled) {
      flushScheduled = true;
      setTimeout(flush, 0);
    }
  });
}

/**
 * Resolves a single asset for a locally-described (pending) address action.
 *
 * `source` is required and has no default on purpose: this used to resolve the
 * testnet/mainnet channel from a `defi-sdk` `Client` instance, so a default
 * here would silently serve mainnet data in testnet mode.
 */
export async function fetchAssetFromAPI(
  query: AssetQuery,
  source: NetworksSource
): Promise<Asset | null> {
  const fungibleId = getAssetQueryFungibleId(query);
  if (!fungibleId) {
    return null;
  }
  const fungible = await loadFungible(fungibleId, query.currency, source);
  return fungible ? fungibleToAsset(fungible) : null;
}
