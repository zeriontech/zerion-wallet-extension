import type { Asset } from 'defi-sdk';
import { getDecimals } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import { baseToCommon } from './convert';

export function getCommonQuantity({
  asset,
  chain,
  quantity,
}: {
  asset: Asset;
  chain: string;
  quantity: number | string;
}) {
  const decimals = getDecimals({ asset, chain: createChain(chain) });
  return baseToCommon(quantity, decimals);
}
