import type { Asset } from 'defi-sdk';
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import type { Quote } from 'src/shared/types/Quote';

export function getBridgeFeeValueFiat({
  quote,
  chain,
  asset,
}: {
  quote: Quote;
  chain: Chain;
  asset: Asset;
}) {
  if (asset.price?.value == null) {
    return null;
  }

  const quantity = getCommonQuantity({
    baseQuantity: quote.bridge_fee_amount,
    chain,
    asset,
  });

  return quantity.times(asset.price.value);
}
