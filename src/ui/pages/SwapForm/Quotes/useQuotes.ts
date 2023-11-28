import { useSelectorStore, useStore } from '@store-unit/react';
import { useCallback, useMemo, useState } from 'react';
import omit from 'lodash/omit';
import type { SwapFormView } from '@zeriontech/transactions';
import { commonToBase } from 'src/shared/units/convert';
import {
  getAssetImplementationInChain,
  getDecimals,
} from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import type { Quote, TransactionDescription } from './types';
import { useEventSource } from './useEventSource';

const apiUrl = `${DEFI_SDK_TRANSACTIONS_API_URL}/swap/quote/stream`;

export interface QuotesData {
  quote: Quote | null;
  quotes: Quote[] | null;
  transaction:
    | null
    | (Omit<TransactionDescription, 'chain_id'> & { chainId: string });
  setQuote: (quote: Quote) => void;
  isLoading: boolean;
  done: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useQuotes({
  address,
  swapView,
}: {
  address: string;
  swapView: SwapFormView;
}): QuotesData {
  const [selectedQuote, setQuote] = useState<Quote | null>(null);

  const { spendPosition, receivePosition } = swapView;
  const {
    chainInput,
    primaryInput,
    spendTokenInput,
    receiveTokenInput,
    spendInput,
    receiveInput,
  } = useSelectorStore(swapView.store, [
    'primaryInput',
    'chainInput',
    'spendTokenInput',
    'receiveTokenInput',
    'spendInput',
    'receiveInput',
  ]);
  const { slippage } = useStore(swapView.store.configuration);
  const [refetchHash, setRefetchHash] = useState(0);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const url = useMemo(() => {
    const value = primaryInput === 'receive' ? receiveInput : spendInput;
    const position =
      primaryInput === 'receive' ? receivePosition : spendPosition;
    if (
      spendTokenInput &&
      receiveTokenInput &&
      chainInput &&
      value &&
      position &&
      spendPosition &&
      receivePosition
    ) {
      const chain = createChain(chainInput);
      const spendAssetExistsOnChain = getAssetImplementationInChain({
        asset: spendPosition.asset,
        chain,
      });
      const receiveAssetExistsOnChain = getAssetImplementationInChain({
        asset: receivePosition.asset,
        chain,
      });
      if (!spendAssetExistsOnChain || !receiveAssetExistsOnChain) {
        return;
      }
      const valueBase = commonToBase(
        value,
        getDecimals({ asset: position.asset, chain })
      ).toFixed();
      const searchParams = new URLSearchParams({
        from: address,
        input_token: spendTokenInput,
        output_token: receiveTokenInput,
        input_chain: chainInput,
        slippage: String(Number(slippage) * 100),
      });
      if (primaryInput === 'receive') {
        searchParams.append('output_amount', valueBase);
      } else {
        searchParams.append('input_amount', valueBase);
      }
      return `${apiUrl}?${searchParams}`;
    }
  }, [
    primaryInput,
    receiveInput,
    spendInput,
    receivePosition,
    spendPosition,
    spendTokenInput,
    receiveTokenInput,
    chainInput,
    address,
    slippage,
  ]);

  const { value, isLoading, error, done } = useEventSource<Quote[]>(
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

  const quote = selectedQuote || (value?.[0] ?? null);
  const transaction = useMemo(() => {
    if (quote?.transaction) {
      return {
        ...omit(quote.transaction, ['chain_id']),
        chainId: quote.transaction.chain_id,
      };
    } else {
      return null;
    }
  }, [quote?.transaction]);

  return {
    quote,
    setQuote,
    transaction,
    quotes: value,
    isLoading,
    error,
    done,
    refetch,
  };
}
