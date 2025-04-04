import { useCallback, useMemo, useState } from 'react';
import omit from 'lodash/omit';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
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
import type { AddressPosition } from 'defi-sdk';
import { getSlippageOptions } from 'src/ui/pages/SwapForm/SlippageSettings/getSlippageOptions';
import { useEventSource } from './useEventSource';

interface QuotesParams {
  address: string;
  userSlippage: number | null;

  primaryInput?: 'spend' | 'receive';
  spendChainInput?: string;
  receiveChainInput?: string | null;
  spendInput?: string;
  receiveInput?: string;
  spendTokenInput?: string;
  receiveTokenInput?: string;

  spendPosition: AddressPosition | EmptyAddressPosition | null;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
}

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
}: QuotesParams): QuotesData {
  const [selectedQuote, setQuote] = useState<Quote | null>(null);

  const [refetchHash, setRefetchHash] = useState(0);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const url = useMemo(() => {
    const value = primaryInput === 'receive' ? receiveInput : spendInput;
    const position =
      primaryInput === 'receive' ? receivePosition : spendPosition;

    if (
      spendTokenInput &&
      receiveTokenInput &&
      spendChainInput &&
      value &&
      position &&
      spendPosition &&
      receivePosition
    ) {
      const spendChain = createChain(spendChainInput);
      const receiveChain = receiveChainInput
        ? createChain(receiveChainInput)
        : null;

      const spendAssetExistsOnChain = getAssetImplementationInChain({
        asset: spendPosition.asset,
        chain: spendChain,
      });

      const receiveAssetExistsOnChain = getAssetImplementationInChain({
        asset: receivePosition.asset,
        chain: receiveChain ?? spendChain,
      });

      if (!spendAssetExistsOnChain || !receiveAssetExistsOnChain) {
        return;
      }

      if (!isNumeric(value) || Number(value) === 0) {
        return;
      }

      const chain =
        primaryInput === 'receive' && receiveChain ? receiveChain : spendChain;

      const valueBase = commonToBase(
        value,
        getDecimals({ asset: position.asset, chain })
      ).toFixed();

      const { slippagePercent } = getSlippageOptions({
        chain,
        userSlippage,
      });

      const searchParams = new URLSearchParams({
        from: address,
        input_token: spendTokenInput,
        output_token: receiveTokenInput,
        input_chain: spendChainInput,
        slippage: String(slippagePercent),
      });
      if (receiveChainInput) {
        searchParams.append('output_chain', receiveChainInput);
      }
      if (primaryInput === 'receive') {
        searchParams.append('output_amount', valueBase);
      } else {
        searchParams.append('input_amount', valueBase);
      }

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
    spendChainInput,
    receiveChainInput,
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
