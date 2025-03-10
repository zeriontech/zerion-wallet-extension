import BigNumber from 'bignumber.js';
import type { SwapFormView } from '@zeriontech/transactions';
import { createChain } from 'src/modules/networks/Chain';
import type { Quote } from 'src/shared/types/Quote';
import { exceedsPriceImpactThreshold } from 'src/ui/pages/SwapForm/shared/price-impact';
import { assetQuantityToValue, toMaybeArr } from './helpers';

export function formViewToAnalytics({
  formView,
  quote,
}: {
  formView: SwapFormView;
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

  const enough_balance = new BigNumber(
    formView.spendPosition?.quantity || 0
  ).gt(quote.input_amount_estimation);

  const isPriceImpactWarning = exceedsPriceImpactThreshold({
    relativeChange: (usdAmountSend - usdAmountReceived) / usdAmountReceived,
  });

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
    slippage: formView.store.configuration.getState().slippage,
    contract_type: quote.contract_metadata?.name,
    enough_balance,
    enough_allowance: Boolean(quote.transaction),
    warning_was_shown: isPriceImpactWarning,
    // TODO after new asset endpoint is merged: fdv_asset_sent
    // TODO after new asset endpoint is merged: fdv_asset_received
    // TODO after bridge form is merged: bridge_fee_usd_amount
    // TODO after new validation for fields is merged: output_amount_color
  };
}
