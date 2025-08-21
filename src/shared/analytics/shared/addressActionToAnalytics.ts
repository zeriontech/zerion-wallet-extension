import { isTruthy } from 'is-truthy-ts';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Quote2 } from 'src/shared/types/Quote';

interface AnalyticsTransactionData {
  action_type: string;
  usd_amount_sent: number | null;
  usd_amount_received: number | null;
  asset_amount_sent?: (string | null)[];
  asset_name_sent?: string[];
  asset_address_sent?: string[];
  asset_amount_received?: (string | null)[];
  asset_name_received?: string[];
  asset_address_received?: string[];
  zerion_fee_percentage?: number;
  zerion_fee_usd_amount?: number;
  output_chain?: string;
  network_fee?: number;
  gas_price?: number;
}

export function toMaybeArr<T>(
  arr: (T | null | undefined)[] | null | undefined
): T[] | undefined {
  return arr?.length ? arr.filter(isTruthy) : undefined;
}

export function addressActionToAnalytics({
  addressAction,
  quote,
  outputChain,
}: {
  addressAction: AnyAddressAction | null;
  quote?: Quote2;
  outputChain: string | null;
}): AnalyticsTransactionData {
  if (!addressAction) {
    return {
      action_type: 'Execute',
      asset_amount_sent: [],
      usd_amount_received: null,
      usd_amount_sent: null,
    };
  }
  const outgoing = addressAction.acts
    ?.at(0)
    ?.content?.transfers?.filter(({ direction }) => direction === 'out');
  const incoming = addressAction.acts
    ?.at(0)
    ?.content?.transfers?.filter(({ direction }) => direction === 'in');

  const value = {
    action_type: addressAction.type.displayValue || 'Execute',
    usd_amount_sent:
      outgoing?.reduce((acc, item) => acc + (item.amount?.usdValue || 0), 0) ??
      null,
    usd_amount_received:
      incoming?.reduce((acc, item) => acc + (item.amount?.usdValue || 0), 0) ??
      null,
    asset_amount_sent: toMaybeArr(
      outgoing?.map((item) => item.amount?.quantity)
    ),
    asset_amount_received: toMaybeArr(
      incoming?.map((item) => item.amount?.quantity)
    ),
    asset_name_sent: toMaybeArr(outgoing?.map((item) => item.fungible?.name)),
    asset_name_received: toMaybeArr(
      incoming?.map((item) => item.fungible?.name)
    ),
    asset_address_sent: toMaybeArr(outgoing?.map((item) => item.fungible?.id)),
    asset_address_received: toMaybeArr(
      incoming?.map((item) => item.fungible?.id)
    ),
  };
  if (quote) {
    const zerion_fee_percentage = quote.protocolFee.percentage;
    const zerion_fee_usd_amount =
      quote.protocolFee.amount.usdValue ?? undefined;
    const network_fee = quote.networkFee?.amount?.usdValue ?? undefined;
    const currentTransactionEvm =
      quote.transactionSwap?.evm || quote.transactionApprove?.evm;
    const gas_price =
      currentTransactionEvm?.gasPrice != null
        ? Number(currentTransactionEvm.gasPrice)
        : undefined;

    return {
      ...value,
      zerion_fee_percentage,
      zerion_fee_usd_amount,
      network_fee,
      gas_price,
      output_chain: outputChain ?? undefined,
    };
  } else {
    return value;
  }
}
