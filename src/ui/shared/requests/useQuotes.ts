import { createChain } from 'src/modules/networks/Chain';
import { isNumeric } from 'src/shared/isNumeric';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { ZERION_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';
import type { SwapFormState } from 'src/ui/pages/SwapForm/shared/SwapFormState';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import { createHeaders } from 'src/modules/zerion-api/shared';
import { weiToGweiStr } from 'src/shared/units/formatGasPrice';
import { invariant } from 'src/shared/invariant';
import { walletPort } from '../channels';
import { useGasPrices } from './useGasPrices';
import { useEventSource } from './useEventSource';
export interface QuotesData<T> {
  quotes: T[] | null;
  isLoading: boolean;
  done: boolean;
  error: Error | null;
  refetch: () => void;
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

const QUOTES_EVENT_CODE_TO_MESSAGE = {
  500: 'Internal Server Error',
  503: 'Service Unavailable',
  404: 'No liquidity for this trade',
  400: 'Incorrect trade parameters',
};

export function useQuotes2({
  address,
  currency,
  formState,
  enabled = true,
  context,
  pathname,
}: {
  address: string;
  currency: string;
  formState: SwapFormState;
  enabled?: boolean;
  context: 'Swap' | 'Bridge';
  pathname: string;
}) {
  const [refetchHash, setRefetchHash] = useState(0);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const chain = formState.inputChain ? createChain(formState.inputChain) : null;
  const { data: gasPrices } = useGasPrices(chain, {
    refetchInterval: 20000,
    keepPreviousData: true,
  });

  const formStateCompleted = useMemo(() => {
    if (!chain) {
      return null;
    }
    const slippageOptions = getSlippageOptions({
      chain,
      userSlippage:
        formState.slippage != null ? Number(formState.slippage) : null,
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

  const handleQuoteError = useCallback(
    ({
      message,
      code,
      backendMessage,
      requestParams,
    }: {
      message: string;
      code?: number;
      backendMessage?: string;
      requestParams: Partial<SwapFormState> & { from: string };
    }) => {
      invariant(
        requestParams.inputFungibleId,
        'Unable to find inputFungibleId in quotes request'
      );
      invariant(
        requestParams.outputFungibleId,
        'Unable to find outputFungibleId in quotes request'
      );
      invariant(
        requestParams.inputAmount,
        'Unable to find inputAmount in quotes request'
      );
      walletPort.request('quoteError', {
        message,
        errorCode: code,
        backendMessage,
        context,
        actionType: context === 'Swap' ? 'Trade' : 'Send',
        type: context === 'Swap' ? 'Trade form error' : 'Bridge form error',
        address: requestParams.from,
        inputFungibleId: requestParams.inputFungibleId,
        outputFungibleId: requestParams.outputFungibleId,
        inputAmount: requestParams.inputAmount,
        inputChain: requestParams.inputChain || null,
        outputAmount: null,
        outputChain: requestParams.outputChain || null,
        contractType: null,
        pathname,
        slippage: requestParams.slippage
          ? Number(requestParams.slippage)
          : null,
      });
    },
    [context, pathname]
  );

  const {
    value: quotes,
    isLoading,
    error,
    done,
  } = useEventSource<Quote2[]>(
    `${urlWithoutGasPrices ?? 'no-url'}-${refetchHash}`,
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
            Number(formState.inputAmount) > 0 &&
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
      eventCodeToMessage: QUOTES_EVENT_CODE_TO_MESSAGE,
      onError: ({ parsedError, rawEvent, requestUrl }) => {
        handleQuoteError({
          message: parsedError.message,
          code: rawEvent.code,
          backendMessage: rawEvent.message,
          requestParams: Object.fromEntries(
            requestUrl.searchParams.entries()
          ) as Partial<SwapFormState> & {
            from: string;
          },
        });
      },
    }
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (done) {
      timeoutRef.current = setTimeout(() => {
        refetch();
      }, 20000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [done, refetch]);

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
