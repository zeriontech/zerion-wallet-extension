import type {
  CustomConfiguration,
  EmptyAddressPosition,
} from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import type { AddressPosition, Asset } from 'defi-sdk';
import { createChain } from 'src/modules/networks/Chain';
import type { Quote } from 'src/shared/types/Quote';
import {
  calculatePriceImpact,
  isHighValueLoss,
} from 'src/ui/pages/SwapForm/shared/price-impact';
import { assetQuantityToValue, toMaybeArr } from './helpers';

export interface AnalyticsFormData {
  spendAsset: Asset;
  receiveAsset: Asset;
  spendPosition: AddressPosition | EmptyAddressPosition;
  configuration: CustomConfiguration;
}

export function formDataToAnalytics({
  formData,
  quote,
}: {
  formData: AnalyticsFormData;
  quote: Quote;
}) {
  const zerion_fee_percentage = quote.protocol_fee;
  const feeAmount = quote.protocol_fee_amount;
  const spendAsset = formData.spendAsset;
  const inputChain = createChain(quote.input_chain);
  const receiveAsset = formData.receiveAsset;
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
    formData.spendPosition?.quantity || 0
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
    asset_name_sent: toMaybeArr([formData.spendAsset?.name]),
    asset_name_received: toMaybeArr([formData.receiveAsset?.name]),
    asset_address_sent: toMaybeArr([formData.spendAsset?.asset_code]),
    asset_address_received: toMaybeArr([formData.receiveAsset?.asset_code]),
    gas: quote.transaction?.gas,
    network_fee: null, // TODO
    gas_price: null, // TODO
    guaranteed_output_amount: quote.guaranteed_output_amount,
    zerion_fee_percentage,
    zerion_fee_usd_amount,
    input_chain: quote.input_chain,
    output_chain: quote.output_chain ?? quote.input_chain,
    slippage: formData.configuration.slippage,
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
