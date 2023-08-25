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
