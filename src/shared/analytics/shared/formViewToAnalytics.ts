import type {
  CustomConfiguration,
  SwapFormView,
} from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Quote } from 'src/shared/types/Quote';
import {
  calculatePriceImpact,
  isHighValueLoss,
} from 'src/ui/pages/SwapForm/shared/price-impact';

function toMaybeArr<T>(
  arr: (T | null | undefined)[] | null | undefined
): T[] | undefined {
  return arr?.filter(isTruthy) ?? undefined;
}

interface AssetQuantity {
  asset: Asset | null;
  quantity: string | null;
}

function assetQuantityToValue(
  assetWithQuantity: AssetQuantity,
  chain: Chain
): number {
  const { asset, quantity } = assetWithQuantity;
  if (asset && 'implementations' in asset && asset.price && quantity !== null) {
    return getCommonQuantity({ asset, chain, baseQuantity: quantity })
      .times(asset.price.value)
      .toNumber();
  }
  return 0;
}

export type FormViewForAnalytics = Pick<
  SwapFormView,
  'spendAsset' | 'receiveAsset' | 'spendPosition'
> & { configuration: CustomConfiguration };

export function formViewToAnalytics({
  formView,
  quote,
}: {
  formView: FormViewForAnalytics;
  quote: Quote;
}) {
  const zerion_fee_percentage = quote.protocol_fee;
  const feeAmount = quote.protocol_fee_amount;
  const spendAsset = formView.spendAsset;
  const inputChain = createChain(quote.input_chain);
  const receiveAsset = formView.receiveAsset;
  const outputChain = createChain(quote.output_chain);
  const zerion_fee_usd_amount = assetQuantityToValue(
    { quantity: feeAmount, asset: spendAsset },
    inputChain
  );
  const usdAmountSend = assetQuantityToValue(
    { quantity: quote.input_amount_estimation, asset: spendAsset },
    inputChain
  );
  const usdAmountReceived = assetQuantityToValue(
    { quantity: quote.output_amount_estimation, asset: receiveAsset },
    outputChain
  );

  const inputValue = quote.input_amount_estimation;
  const outputValue = quote.output_amount_estimation;

  const enough_balance = new BigNumber(
    formView.spendPosition?.quantity || 0
  ).gt(quote.input_amount_estimation);

  const priceImpact = calculatePriceImpact({
    inputValue,
    outputValue,
    inputAsset: spendAsset,
    outputAsset: receiveAsset,
  });

  const isHighLoss = priceImpact && isHighValueLoss(priceImpact);

  return {
    usd_amount_sent: toMaybeArr([usdAmountSend]),
    usd_amount_received: toMaybeArr([usdAmountReceived]),
    asset_amount_sent: toMaybeArr([quote.input_amount_estimation]),
    asset_amount_received: toMaybeArr([quote.output_amount_estimation]),
    asset_name_sent: toMaybeArr([formView.spendAsset?.name]),
    asset_name_received: toMaybeArr([formView.receiveAsset?.name]),
    asset_address_sent: toMaybeArr([formView.spendAsset?.asset_code]),
    asset_address_received: toMaybeArr([formView.receiveAsset?.asset_code]),
    gas: quote.transaction?.gas,
    network_fee: null, // TODO
    gas_price: null, // TODO
    guaranteed_output_amount: quote.guaranteed_output_amount,
    zerion_fee_percentage,
    zerion_fee_usd_amount,
    input_chain: quote.input_chain,
    output_chain: quote.output_chain ?? quote.input_chain,
    slippage: formView.configuration.slippage,
    contract_type: quote.contract_metadata?.name,
    enough_balance,
    enough_allowance: Boolean(quote.transaction),
    warning_was_shown: isHighLoss,
    // TODO add fdv_asset_sent
    // TODO add fdv_asset_received
    // TODO add bridge_fee_usd_amount
    // TODO after new validation for fields is merged: output_amount_color
  };
}
