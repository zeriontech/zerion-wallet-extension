import BigNumber from 'bignumber.js';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';

type FeeLike =
  | {
      amount: { quantity: string } | null;
      fungible: { id: string } | null;
    }
  | null
  | undefined;

/**
 * The fee asset's fiat price and the fee's fiat value for a `networkFee`.
 * Shared by the Send row and analytics so both use the same price source.
 */
export function useNetworkFeeFiatValue({
  networkFee,
  network,
  currency,
}: {
  networkFee: FeeLike;
  network: NetworkInfo | null;
  currency: string;
}) {
  const feeFungibleId = networkFee?.fungible?.id ?? network?.baseAsset?.id;
  const { data: feeFungibleResponse } = useAssetListFungibles(
    feeFungibleId ? { fungibleIds: [feeFungibleId], currency } : { currency },
    { suspense: false },
  );
  const feePrice = feeFungibleId
    ? (feeFungibleResponse?.data.find((f) => f.id === feeFungibleId)?.meta.price ?? null)
    : null;
  const feeQuantity = networkFee?.amount?.quantity ?? null;
  const feeFiatValue =
    feeQuantity && feePrice != null
      ? new BigNumber(feeQuantity).multipliedBy(feePrice).toNumber()
      : null;
  return { feeFungibleId, feePrice, feeQuantity, feeFiatValue };
}
