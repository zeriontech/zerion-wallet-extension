import type { Asset } from 'src/defi-sdk.types';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
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
 * Resolves a single asset for a locally-described (pending) address action.
 *
 * `source` is required and has no default on purpose: this used to resolve the
 * testnet/mainnet channel from a `defi-sdk` `Client` instance, so a default
 * here would silently serve mainnet data in testnet mode.
 */
export async function fetchAssetFromAPI(
  { address, isNative, id, currency }: AssetQuery,
  source: NetworksSource
): Promise<Asset | null> {
  // Native assets are addressed by their fungible id; everything else by the
  // contract address, which is the fungible id for most ERC-20s.
  const fungibleId = isNative ? id : normalizeNullableAddress(address);
  if (!fungibleId) {
    return null;
  }
  const response = await ZerionAPI.assetListFungibles(
    { fungibleIds: [fungibleId], currency },
    { source }
  );
  // Exactly one id was requested, so a single result is the match even when its
  // canonical id differs from the implementation address we looked it up by.
  const fungible =
    response.data.find((item) => item.id === fungibleId) ??
    response.data[0] ??
    null;
  return fungible ? fungibleToAsset(fungible) : null;
}
