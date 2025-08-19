import type { Asset } from 'defi-sdk';
import { baseToCommon, commonToBase } from 'src/shared/units/convert';
import type BigNumber from 'bignumber.js';
import type { Chain } from './Chain';

export function getAssetImplementationInChain({
  asset,
  chain,
}: {
  asset?: Pick<Asset, 'implementations'>;
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
  baseQuantity,
}: {
  asset: Asset;
  chain: Chain;
  baseQuantity: BigNumber.Value;
}) {
  const decimals = getDecimals({ asset, chain });
  return baseToCommon(baseQuantity, decimals);
}

export function getBaseQuantity({
  asset,
  chain,
  commonQuantity,
}: {
  asset: Asset;
  chain: Chain;
  commonQuantity: BigNumber.Value;
}) {
  const decimals = getDecimals({ asset, chain });
  return commonToBase(commonQuantity, decimals);
}
