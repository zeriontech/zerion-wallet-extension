import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { getAssetImplementationInChain } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import { isNumeric } from 'src/shared/isNumeric';
import type { AddressPosition } from 'defi-sdk';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { QuoteLegacy, Quote2 } from 'src/shared/types/Quote';
import { getBaseQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { DEFI_SDK_TRANSACTIONS_API_URL, ZERION_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';
import type { SwapFormState } from 'src/ui/pages/SwapForm/shared/SwapFormState';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import { createHeaders } from 'src/modules/zerion-api/shared';
import { weiToGweiStr } from 'src/shared/units/formatGasPrice';
import { useGasPrices } from './useGasPrices';
import { useEventSource } from './useEventSource';

type QuoteSortType = 'amount' | 'time';

interface QuotesParams {
  from?: string;
  to?: string | null;
  inputAssetId: string;
  outputAssetId: string;
  inputChain: Chain;
  outputChain: Chain | null;
  inputAmount?: string;
  outputAmount?: string;
  slippage?: string;
  gasPrice?: string;
  priorityFee?: string;
  maxFee?: string;
  sourceId?: string;
  sort: QuoteSortType;
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
  if (params.to) {
    searchParams.append('to', params.to);
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
  searchParams.append('sort', params.sort);
  if (params.to) {
    searchParams.append('to', params.to);
  }

  return searchParams;
}

function getQuotesStreamUrl({
  primaryInput,
  from,
  to,
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
  from: string;
  to: string | null;
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
    from,
    to,
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

export interface QuotesData<T> {
  quotes: T[] | null;
  isLoading: boolean;
  done: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useQuotesLegacy({
  from,
  to,
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
  sortType,
}: {
  primaryInput: 'spend' | 'receive';
  from: string;
  to?: string | null;
  userSlippage: number | null;
  spendChainInput?: string;
  receiveChainInput?: string | null;
  spendInput?: string;
  receiveInput?: string;
  spendTokenInput?: string;
  receiveTokenInput?: string;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
  sortType: QuoteSortType;
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
        from,
        to: to ?? null,
        slippage: String(slippagePercent),
        amountCommon: amount,
        inputChain,
        outputChain,
        inputAssetId: spendTokenInput,
        outputAssetId: receiveTokenInput,
        inputPosition: spendPosition,
        outputPosition: receivePosition,
        sort: sortType,
      });
    }

    return null;
  }, [
    from,
    to,
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
    sortType,
  ]);

  const {
    value: quotes,
    isLoading,
    error,
    done,
  } = useEventSource<QuoteLegacy[]>(
    `${url ?? 'no-url'}-${refetchHash}`,
    url ?? null,
    {
      mergeResponse: (currentValue, nextValue) => {
        if (!currentValue) {
          return nextValue;
        }
        if (!nextValue) {
          return currentValue;
        }
        return currentValue.map((item) => {
          const updatedItem = nextValue.find(
            (nextItem) =>
              nextItem.contract_metadata &&
              item.contract_metadata &&
              nextItem.contract_metadata.id === item.contract_metadata.id
          );
          return updatedItem || item;
        });
      },
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

function createSwapQuotesUrl(address: string, formState: SwapFormState) {
  const searchParams = new URLSearchParams(
    Object.entries(formState).filter(([_, v]) => v)
  );
  searchParams.set('from', address);
  return createUrl({
    base: ZERION_API_URL,
    pathname: '/transaction/stream-swap-quotes/v1',
    searchParams,
  }).toString();
}

function applyGasPrices(
  formState: SwapFormState,
  gasPrices: ChainGasPrice | null
): SwapFormState {
  const { networkFeeSpeed = 'fast', ...restFormState } = formState;
  if (networkFeeSpeed !== 'custom') {
    const { gasLimit, gasPrice, maxFee, maxPriorityFee, ...withoutGasPrices } =
      restFormState;
    if (!gasPrices) {
      return withoutGasPrices; // backend will automatically assign something and that's what we want
    }
    const x = assignGasPrice({}, gasPrices[networkFeeSpeed]);
    if ('maxPriorityFeePerGas' in x) {
      return {
        ...withoutGasPrices,
        maxFee: weiToGweiStr(x.maxFeePerGas),
        maxPriorityFee: weiToGweiStr(x.maxPriorityFeePerGas),
      };
    } else if ('gasPrice' in x) {
      return { ...withoutGasPrices, gasPrice: weiToGweiStr(x.gasPrice) };
    }
    return withoutGasPrices;
  } else {
    return restFormState;
  }
}

export function useQuotes2({
  address,
  currency,
  formState,
  enabled = true,
}: {
  address: string;
  currency: string;
  formState: SwapFormState;
  enabled?: boolean;
}) {
  const [refetchHash, setRefetchHash] = useState(0);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const chain = formState.inputChain ? createChain(formState.inputChain) : null;
  const { data: gasPrices } = useGasPrices(chain);

  const formStateCompleted = useMemo(() => {
    if (!chain) {
      return null;
    }
    const slippageOptions = getSlippageOptions({
      chain,
      userSlippage: formState.slippage ? Number(formState.slippage) : null,
    });
    return {
      ...formState,
      currency,
      slippage: String(slippageOptions.slippagePercent),
    };
  }, [chain, currency, formState]);

  const urlWithoutGasPrices = useMemo(() => {
    if (!formStateCompleted) {
      return null;
    }
    return createSwapQuotesUrl(address, formStateCompleted);
  }, [formStateCompleted, address]);

  const url = useMemo(() => {
    if (!formStateCompleted) {
      return null;
    }
    const formStateWithGasPrices = applyGasPrices(
      formStateCompleted,
      gasPrices || null
    );
    return createSwapQuotesUrl(address, formStateWithGasPrices);
  }, [formStateCompleted, gasPrices, address]);

  const {
    value: quotes,
    isLoading,
    error,
    done,
  } = useEventSource<Quote2[]>(
    `${url ?? 'no-url'}-${refetchHash}`,
    url ?? null,
    {
      headers: createHeaders({}),
      enabled:
        enabled &&
        Boolean(
          address &&
            formState.inputChain &&
            formState.inputAmount &&
            isNumeric(formState.inputAmount) &&
            formState.inputFungibleId &&
            formState.outputFungibleId
        ),
      mergeResponse: (currentValue, nextValue) => {
        if (!currentValue) {
          return nextValue;
        }
        if (!nextValue) {
          return currentValue;
        }
        return currentValue.map((item) => {
          const updatedItem = nextValue.find(
            (nextItem) =>
              nextItem.contractMetadata &&
              item.contractMetadata &&
              nextItem.contractMetadata.id === item.contractMetadata.id
          );
          return updatedItem || item;
        });
      },
    }
  );

  /**
   * The following is a very hacky way to create "keepPreviousData"
   * behavior. We do this because gasPrices get updates every ~20 seconds and this
   * leads to a new request, which loses old request and shows loading the UI.
   * But gas prices change by very little so they don't justify the flicker of the UI.
   */
  const resultRef = useRef(quotes);
  const urlWithoutGasPricesRef = useRef(urlWithoutGasPrices);

  const usePreviousData =
    urlWithoutGasPrices === urlWithoutGasPricesRef.current && !done;

  if (urlWithoutGasPrices !== urlWithoutGasPricesRef.current) {
    urlWithoutGasPricesRef.current = urlWithoutGasPrices;
    resultRef.current = null;
  }

  if (done && quotes && !error) {
    resultRef.current = quotes;
  }
  if (error) {
    resultRef.current = null;
  }

  return {
    quotes: usePreviousData && resultRef.current ? resultRef.current : quotes,
    isPreviousData: Boolean(usePreviousData && resultRef.current),
    isLoading,
    error,
    done,
    refetch,
  };
}
