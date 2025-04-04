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
import { isNumeric } from 'src/shared/isNumeric';
import type { Quote, TransactionDescription } from 'src/shared/types/Quote';
import { createUrl } from 'src/shared/createUrl';
import { invariant } from 'src/shared/invariant';
import { getSlippageOptions } from '../SlippageSettings/getSlippageOptions';
import { useEventSource } from './useEventSource';

export interface QuotesData {
  quote: Quote | null;
  quotes: Quote[] | null;
  transaction:
    | null
    | (Omit<TransactionDescription, 'chain_id' | 'gas'> & {
        chainId: string;
        gasLimit: string;
      });
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
  const { slippage: userSlippage } = useStore(swapView.store.configuration);

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
      if (!isNumeric(value) || Number(value) === 0) {
        return;
      }
      const valueBase = commonToBase(
        value,
        getDecimals({ asset: position.asset, chain })
      ).toFixed();

      const { slippagePercent } = getSlippageOptions({ chain, userSlippage });

      const searchParams = new URLSearchParams({
        from: address,
        input_token: spendTokenInput,
        output_token: receiveTokenInput,
        input_chain: chainInput,
        slippage: String(slippagePercent),
      });
      if (primaryInput === 'receive') {
        searchParams.append('output_amount', valueBase);
      } else {
        searchParams.append('input_amount', valueBase);
      }

      invariant(
        DEFI_SDK_TRANSACTIONS_API_URL,
        'DEFI_SDK_TRANSACTIONS_API_URL not found in env'
      );
      return createUrl({
        base: DEFI_SDK_TRANSACTIONS_API_URL,
        pathname: '/swap/quote/stream',
        searchParams,
      }).toString();
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
    userSlippage,
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
        ...omit(quote.transaction, ['chain_id', 'gas']),
        chainId: quote.transaction.chain_id,
        gasLimit: String(quote.transaction.gas),
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
