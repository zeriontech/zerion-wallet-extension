import type {
  CustomConfiguration,
  EmptyAddressPosition,
} from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import type { AddressPosition, Asset } from 'defi-sdk';
import { createChain } from 'src/modules/networks/Chain';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import type { Quote } from 'src/shared/types/Quote';
import {
  calculatePriceImpact,
  isHighValueLoss,
  isSignificantValueLoss,
} from 'src/ui/pages/SwapForm/shared/price-impact';
import { getCommonQuantity } from 'src/modules/networks/asset';
import {
  assetQuantityToValue,
  createQuantityConverter,
  toMaybeArr,
} from './helpers';

export interface AnalyticsFormData {
  spendAsset: Asset;
  receiveAsset: Asset;
  spendPosition: AddressPosition | EmptyAddressPosition;
  configuration: CustomConfiguration;
}

async function fetchAssetFullInfo(
  params: Parameters<typeof ZerionAPI.assetGetFungibleFullInfo>[0]
) {
  return backgroundQueryClient.fetchQuery({
    queryKey: ['ZerionAPI.fetchAssetFullInfo', params],
    queryFn: () => ZerionAPI.assetGetFungibleFullInfo(params),
    // Here this endpoint is used to fetch FDV (Fully Diluted Valuation) for analytics.
    // While FDV can change quickly for new tokens, in practice backend/indexing services typically update this data less frequently.
    // The main purpose of caching here is to reduce redundant requests while the user interacts with the form.
    // This 30-minute cache should provide a good balance between data freshness and efficiency.
    staleTime: 1000 * 60 * 30,
  });
}

export async function formDataToAnalytics(
  scope: 'Swap' | 'Bridge',
  {
    currency,
    formData: { spendAsset, receiveAsset, spendPosition, configuration },
    quote,
  }: {
    currency: string;
    formData: AnalyticsFormData;
    quote: Quote;
  }
) {
  const spendAssetInfo = await fetchAssetFullInfo({
    fungibleId: spendAsset.asset_code,
    currency,
  });
  const receiveAssetInfo = await fetchAssetFullInfo({
    fungibleId: receiveAsset.asset_code,
    currency,
  });

  const fdvAssetSent = spendAssetInfo.data.fungible.meta.fullyDilutedValuation;
  const fdvAssetReceived =
    receiveAssetInfo.data.fungible.meta.fullyDilutedValuation;

  const zerion_fee_percentage = quote.protocol_fee;
  const feeAmount = quote.protocol_fee_amount;
  const inputChain = createChain(quote.input_chain);
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

  const enough_balance = new BigNumber(spendPosition?.quantity || 0).gt(
    quote.input_amount_estimation
  );

  const convertQuantity = createQuantityConverter(inputChain);

  const bridgeFeeAmountInUsd =
    scope === 'Bridge'
      ? getCommonQuantity({
          baseQuantity: quote.bridge_fee_amount,
          chain: createChain(quote.input_chain),
          asset: spendAsset,
        }).times(spendAsset.price?.value || 0)
      : null;

  const assetAmountSent = convertQuantity({
    asset: spendAsset,
    quantity: quote.input_amount_estimation,
  });
  const assetAmountReceived = convertQuantity({
    asset: receiveAsset,
    quantity: quote.output_amount_estimation,
  });

  const priceImpact = calculatePriceImpact({
    inputValue: assetAmountSent,
    outputValue: assetAmountReceived,
    inputAsset: spendAsset,
    outputAsset: receiveAsset,
  });

  const isHighPriceImpact = priceImpact && isHighValueLoss(priceImpact);
  const outputAmountColor =
    priceImpact && isSignificantValueLoss(priceImpact) ? 'red' : 'grey';

  return {
    usd_amount_sent: toMaybeArr([usdAmountSend]),
    usd_amount_received: toMaybeArr([usdAmountReceived]),
    asset_amount_sent: toMaybeArr([assetAmountSent]),
    asset_amount_received: toMaybeArr([assetAmountReceived]),
    asset_name_sent: toMaybeArr([spendAsset?.name]),
    asset_name_received: toMaybeArr([receiveAsset?.name]),
    asset_address_sent: toMaybeArr([spendAsset?.asset_code]),
    asset_address_received: toMaybeArr([receiveAsset?.asset_code]),
    gas: quote.transaction?.gas,
    network_fee: null, // TODO
    gas_price: null, // TODO
    guaranteed_output_amount: convertQuantity({
      asset: receiveAsset,
      quantity: quote.guaranteed_output_amount,
    }),
    zerion_fee_percentage,
    zerion_fee_usd_amount,
    input_chain: quote.input_chain,
    output_chain: quote.output_chain ?? quote.input_chain,
    slippage: configuration.slippage,
    contract_type: quote.contract_metadata?.name,
    enough_balance,
    enough_allowance: Boolean(quote.transaction),
    warning_was_shown: isHighPriceImpact,
    fdv_asset_sent: fdvAssetSent,
    fdv_asset_received: fdvAssetReceived,
    bridge_fee_usd_amount: bridgeFeeAmountInUsd,
    output_amount_color: outputAmountColor,
  };
}
