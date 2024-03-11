import type { ActionAsset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { getDecimals } from 'src/modules/networks/asset';
import type { Quote } from 'src/shared/types/Quote';
import { baseToCommon } from 'src/shared/units/convert';

interface AnalyticsTransactionData {
  action_type: string;
  usd_amount_sent: number | null;
  usd_amount_received: number | null;
  asset_amount_sent?: (string | null)[];
  asset_name_sent?: string[];
  asset_address_sent?: string[];
  asset_amount_received?: (string | null)[];
  asset_name_received?: string[];
  asset_address_received?: string[];
  zerion_fee_percentage?: number;
  zerion_fee_usd_amount?: number;
}

interface AssetQuantity {
  asset: ActionAsset;
  quantity: string | null;
}

function assetQuantityToValue(
  assetWithQuantity: AssetQuantity,
  chain: Chain
): number {
  const { asset: actionAsset, quantity } = assetWithQuantity;
  const asset = getFungibleAsset(actionAsset);
  if (asset && 'implementations' in asset && asset.price && quantity !== null) {
    return baseToCommon(quantity, getDecimals({ asset, chain }))
      .times(asset.price.value)
      .toNumber();
  }
  return 0;
}

function createPriceAdder(chain: Chain) {
  return (total: number, assetQuantity: AssetQuantity) => {
    total += assetQuantityToValue(assetQuantity, chain);
    return total;
  };
}

function createQuantityConverter(chain: Chain) {
  return ({
    asset: actionAsset,
    quantity,
  }: {
    asset: ActionAsset;
    quantity: string | null;
  }): string | null => {
    const asset = getFungibleAsset(actionAsset);
    if (asset && quantity !== null) {
      return baseToCommon(quantity, getDecimals({ asset, chain })).toFixed();
    }
    return null;
  };
}

function getAssetName({ asset }: { asset: ActionAsset }) {
  return getFungibleAsset(asset)?.name;
}

function toMaybeArr<T>(
  arr: (T | null | undefined)[] | null | undefined
): T[] | undefined {
  return arr?.length ? arr.filter(isTruthy) : undefined;
}

export function addressActionToAnalytics({
  addressAction,
  quote,
}: {
  addressAction: AnyAddressAction | null;
  quote?: Quote;
}): AnalyticsTransactionData | null {
  if (!addressAction) {
    return null;
  }
  const chain = createChain(addressAction.transaction.chain);
  const convertQuantity = createQuantityConverter(chain);
  const addAssetPrice = createPriceAdder(chain);

  const outgoing = addressAction.content?.transfers?.outgoing;
  const incoming = addressAction.content?.transfers?.incoming;

  const value = {
    action_type: addressAction.type.display_value,
    usd_amount_sent: outgoing?.reduce(addAssetPrice, 0) ?? null,
    usd_amount_received: incoming?.reduce(addAssetPrice, 0) ?? null,
    asset_amount_sent: toMaybeArr(outgoing?.map(convertQuantity)),
    asset_amount_received: toMaybeArr(incoming?.map(convertQuantity)),
    asset_name_sent: toMaybeArr(outgoing?.map(getAssetName)),
    asset_name_received: toMaybeArr(incoming?.map(getAssetName)),
  };
  if (quote) {
    const zerion_fee_percentage = quote.protocol_fee;
    const feeAmount = quote.protocol_fee_amount;
    const asset = incoming?.[0]?.asset;
    const zerion_fee_usd_amount =
      feeAmount && asset
        ? assetQuantityToValue({ quantity: feeAmount, asset }, chain)
        : undefined;

    return { ...value, zerion_fee_percentage, zerion_fee_usd_amount };
  } else {
    return value;
  }
}
