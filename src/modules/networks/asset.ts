import BigNumber from 'bignumber.js';
import type { Asset } from 'defi-sdk';
import { baseToCommon } from 'src/shared/units/convert';
import type { Chain } from './Chain';

export function getAssetImplementationInChain({
  asset,
  chain,
}: {
  asset?: Asset;
  chain: Chain;
}) {
  return asset?.implementations?.[String(chain)];
}

export function getDecimals({ asset, chain }: { asset: Asset; chain: Chain }) {
  return (
    getAssetImplementationInChain({ asset, chain })?.decimals || asset.decimals
  );
}

export function getAddress({
  asset,
  chain,
}: {
  asset?: Asset;
  chain: Chain;
}): string | null | undefined {
  const chainImplementation = getAssetImplementationInChain({ asset, chain });
  return chainImplementation ? chainImplementation.address : undefined;
}

export function getCommonQuantity({
  asset,
  chain,
  quantity,
}: {
  asset: Asset;
  chain: Chain;
  quantity: number | string;
}) {
  const decimals = getDecimals({ asset, chain });
  return baseToCommon(quantity, decimals);
}

export type AssetQuantity =
  | { type: 'veryLarge' }
  | { type: 'large' }
  | {
      type: 'normal';
      value: BigNumber;
    };

export function getAssetQuantity({
  asset,
  chain,
  quantity,
}: {
  asset: Asset;
  chain: Chain;
  quantity: number | string;
}): AssetQuantity {
  const value = getCommonQuantity({
    asset,
    chain,
    quantity,
  });

  if (value.gt(new BigNumber(1e21))) {
    return { type: 'veryLarge' };
  } else if (value.gt(new BigNumber(1e15))) {
    return { type: 'large' };
  }

  return { type: 'normal', value };
}
