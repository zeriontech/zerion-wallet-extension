import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { getDecimals } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';

export function toMaybeArr<T>(
  arr: (T | null | undefined)[] | null | undefined
): T[] | undefined {
  return arr?.length ? arr.filter(isTruthy) : undefined;
}

interface AssetQuantity {
  asset: Asset | null;
  quantity: string | null;
}

export function assetQuantityToValue(
  assetWithQuantity: AssetQuantity,
  chain: Chain
): number {
  const { asset, quantity } = assetWithQuantity;
  if (asset && 'implementations' in asset && asset.price && quantity !== null) {
    return baseToCommon(quantity, getDecimals({ asset, chain }))
      .times(asset.price.value)
      .toNumber();
  }
  return 0;
}
