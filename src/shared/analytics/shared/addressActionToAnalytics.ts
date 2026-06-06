import { isTruthy } from 'is-truthy-ts';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Transfer } from 'src/modules/zerion-api/requests/wallet-get-actions';
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

/**
 * Resolves the on-chain contract address of a transfer's asset.
 *
 * `fungible.id` is the backend's fungibleId (often a UUID like
 * `41c0a219-…`), NOT an asset address — sending it as `asset_address` was the
 * bug behind WLT-1357. The real contract address lives in
 * `fungible.implementations[chain].address`. We prefer the implementation on
 * the action's own chain; if it's missing (or the chain is unknown) we fall
 * back to any non-null implementation address. Native assets (e.g. ETH on
 * Ethereum) have no contract address, so this returns `null` for them rather
 * than a bogus value.
 */
function getTransferAssetAddress(
  transfer: Transfer,
  chain: string | null
): string | null {
  const implementations = transfer.fungible?.implementations;
  if (!implementations) {
    return null;
  }
  if (chain && implementations[chain]?.address) {
    return implementations[chain].address;
  }
  return (
    Object.values(implementations).find((impl) => impl.address)?.address ?? null
  );
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
  const act = addressAction.acts?.at(0);
  const actChain = act?.transaction?.chain?.id ?? null;
  const outgoing = act?.content?.transfers?.filter(
    ({ direction }) => direction === 'out'
  );
  const incoming = act?.content?.transfers?.filter(
    ({ direction }) => direction === 'in'
  );

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
    asset_address_sent: toMaybeArr(
      outgoing?.map((item) => getTransferAssetAddress(item, actChain))
    ),
    // For cross-chain (bridge) actions the received asset lives on the output
    // chain, not the act's (source) chain — prefer it when resolving its
    // implementation address.
    asset_address_received: toMaybeArr(
      incoming?.map((item) =>
        getTransferAssetAddress(item, outputChain ?? actChain)
      )
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
