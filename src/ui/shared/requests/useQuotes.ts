import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { getAssetImplementationInChain } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import { isNumeric } from 'src/shared/isNumeric';
import type { AddressPosition } from 'defi-sdk';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import { useCallback, useMemo, useState } from 'react';
import type { Quote } from 'src/shared/types/Quote';
import { getBaseQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';
import omit from 'lodash/omit';
import { useEventSource } from './useEventSource';

type QuoteSortType = 'amount' | 'time';

interface QuotesParams {
  inputAssetId: string;
  outputAssetId: string;
  inputChain: Chain;
  outputChain: Chain | null;
  inputAmount?: string;
  outputAmount?: string;
  from?: string;
  slippage?: string;
  gasPrice?: string;
  priorityFee?: string;
  maxFee?: string;
  sourceId?: string;
  sort?: QuoteSortType;
  to?: string;
}

function getQuotesSearchParams(params: QuotesParams): URLSearchParams {
  const searchParams = new URLSearchParams({
    input_asset_id: params.inputAssetId,
    output_asset_id: params.outputAssetId,
    input_chain: params.inputChain.toString(),
  });

  if (params.inputAmount) {
    searchParams.append('input_amount', params.inputAmount);
  }
  if (params.outputAmount) {
    searchParams.append('output_amount', params.outputAmount);
  }
  if (params.slippage) {
    searchParams.append('slippage', params.slippage);
  }
  if (params.from) {
    searchParams.append('from', params.from);
  }
  if (params.gasPrice) {
    searchParams.append('gas_price', params.gasPrice);
  }
  if (params.priorityFee) {
    searchParams.append('priority_fee', params.priorityFee);
  }
  if (params.maxFee) {
    searchParams.append('max_fee', params.maxFee);
  }
  if (params.sourceId) {
    searchParams.append('source_id', params.sourceId);
  }
  if (params.outputChain) {
    searchParams.append('output_chain', params.outputChain.toString());
  }
  if (params.sort) {
    searchParams.append('sort', params.sort);
  }
  if (params.to) {
    searchParams.append('to', params.to);
  }

  return searchParams;
}

function getQuotesStreamUrl({
  primaryInput,
  address,
  slippage,
  amountCommon,
  inputChain,
  outputChain,
  inputAssetId,
  outputAssetId,
  inputPosition,
  outputPosition,
  sort,
}: {
  primaryInput: 'spend' | 'receive';
  address: string;
  slippage: string;
  amountCommon: string;
  inputChain: Chain;
  outputChain: Chain | null;
  inputAssetId: string;
  outputAssetId: string;
  inputPosition: AddressPosition | EmptyAddressPosition;
  outputPosition: AddressPosition | EmptyAddressPosition;
  sort: QuoteSortType;
}) {
  const chain =
    primaryInput === 'receive' && outputChain ? outputChain : inputChain;
  const position = primaryInput === 'receive' ? outputPosition : inputPosition;

  const amountBase = getBaseQuantity({
    commonQuantity: amountCommon,
    asset: position.asset,
    chain,
  }).toFixed();

  const searchParams = getQuotesSearchParams({
    from: address,
    inputChain,
    outputChain,
    inputAssetId,
    outputAssetId,
    slippage,
    sort,
  });

  if (primaryInput === 'receive') {
    searchParams.append('output_amount', amountBase);
  } else {
    searchParams.append('input_amount', amountBase);
  }

  return createUrl({
    base: DEFI_SDK_TRANSACTIONS_API_URL,
    pathname: '/v2/swap/stream',
    searchParams,
  }).toString();
}

export function getQuoteTx(quote: Quote) {
  return quote.transaction
    ? {
        ...omit(quote.transaction, ['chain_id', 'gas']),
        chainId: quote.transaction.chain_id,
        gasLimit: String(quote.transaction.gas),
      }
    : null;
}

export interface QuotesData {
  quotes: Quote[] | null;
  isLoading: boolean;
  done: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useQuotes({
  address,
  userSlippage,
  primaryInput,
  spendChainInput,
  receiveChainInput,
  spendInput,
  receiveInput,
  spendTokenInput,
  receiveTokenInput,
  spendPosition,
  receivePosition,
  onQuotesReceived,
}: {
  primaryInput: 'spend' | 'receive';
  address: string;
  userSlippage: number | null;
  spendChainInput?: string;
  receiveChainInput?: string | null;
  spendInput?: string;
  receiveInput?: string;
  spendTokenInput?: string;
  receiveTokenInput?: string;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
  onQuotesReceived?: (data: Quote[] | null) => void;
}) {
  const [refetchHash, setRefetchHash] = useState(0);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const url = useMemo(() => {
    const amount = primaryInput === 'receive' ? receiveInput : spendInput;

    const inputChain = spendChainInput ? createChain(spendChainInput) : null;
    const outputChain = receiveChainInput
      ? createChain(receiveChainInput)
      : null;

    if (
      inputChain &&
      spendTokenInput &&
      receiveTokenInput &&
      spendChainInput &&
      amount &&
      spendPosition &&
      receivePosition
    ) {
      const spendAssetExistsOnChain = getAssetImplementationInChain({
        asset: spendPosition.asset,
        chain: inputChain,
      });
      const receiveAssetExistsOnChain = getAssetImplementationInChain({
        asset: receivePosition.asset,
        chain: outputChain ?? inputChain,
      });

      if (!spendAssetExistsOnChain || !receiveAssetExistsOnChain) {
        return null;
      }
      if (!isNumeric(amount) || Number(amount) === 0) {
        return null;
      }

      const chain =
        primaryInput === 'receive' && outputChain ? outputChain : inputChain;
      const { slippagePercent } = getSlippageOptions({ chain, userSlippage });

      return getQuotesStreamUrl({
        primaryInput,
        address,
        slippage: String(slippagePercent),
        amountCommon: amount,
        inputChain,
        outputChain,
        inputAssetId: spendTokenInput,
        outputAssetId: receiveTokenInput,
        inputPosition: spendPosition,
        outputPosition: receivePosition,
        sort: 'amount',
      });
    }

    return null;
  }, [
    address,
    primaryInput,
    receiveChainInput,
    receiveInput,
    receivePosition,
    receiveTokenInput,
    spendChainInput,
    spendInput,
    spendPosition,
    spendTokenInput,
    userSlippage,
  ]);

  const {
    value: quotes,
    isLoading,
    error,
    done,
  } = useEventSource<Quote[]>(
    `${url ?? 'no-url'}-${refetchHash}`,
    url ?? null,
    {
      onEnd: onQuotesReceived,
    }
  );

  return {
    quotes,
    isLoading,
    error,
    done,
    refetch,
  };
}
