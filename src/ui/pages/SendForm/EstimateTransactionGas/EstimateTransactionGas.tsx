import { useEffect, useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useSelectorStore } from '@store-unit/react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { SendFormView } from '@zeriontech/transactions';
import { invariant } from 'src/shared/invariant';
import { useEstimateGas } from 'src/modules/ethereum/transactions/useEstimateGas';

export function EstimateTransactionGas({
  sendFormView,
  render,
}: {
  sendFormView: SendFormView;
  render: (result: {
    gasQuery: UseQueryResult<number | null>;
    transaction: IncomingTransaction | null;
  }) => React.ReactNode;
}) {
  const { tokenItem, nftItem, store } = sendFormView;
  const { type, from, to, tokenValue, tokenChain, nftAmount, nftChain } =
    useSelectorStore(store, [
      'type',
      'from',
      'to',
      'tokenValue',
      'tokenChain',
      'nftAmount',
      'nftChain',
    ]);

  const asset = tokenItem?.asset;
  const { data: transactionData } = useQuery({
    suspense: false,
    keepPreviousData: true,
    queryKey: [
      'sendForm/createSendTransaction',
      type,
      to,
      from,
      tokenChain,
      tokenValue,
      asset,
      nftChain,
      nftAmount,
      nftItem,
    ],
    queryFn: async () => {
      if (type === 'token') {
        invariant(
          tokenChain && asset && tokenValue && to && from,
          'Missing sendForm/createSendTransaction params'
        );
        return store.createSendTransaction({
          tokenChain,
          asset,
          tokenValue,
          to,
          from,
        });
      } else if (type === 'nft') {
        invariant(
          nftChain && nftItem && nftAmount && to && from,
          'Missing sendForm/createSendTransaction nft params'
        );
        return store.createSendNFTTransaction({
          from,
          to,
          nftChain,
          nftAmount,
          nftItem,
        });
      }
    },
    enabled: Boolean(
      type === 'token'
        ? from && to && tokenChain && asset && tokenValue
        : from && to && nftChain && nftAmount && nftItem
    ),
  });

  const transaction = transactionData?.transaction ?? null;
  const estimateGasQuery = useEstimateGas({
    transaction,
    keepPreviousData: true,
  });

  const gas = estimateGasQuery.data;
  useEffect(() => {
    if (gas != null) {
      const propName = type === 'token' ? 'tokenGas' : 'nftGas';
      store.setDefault(propName, String(gas));
    }
  }, [gas, store, type]);

  const transactionWithMaybeGas = useMemo(() => {
    return transaction && gas
      ? { ...transaction, gas: String(gas) }
      : transaction;
  }, [gas, transaction]);

  return render({
    gasQuery: estimateGasQuery,
    transaction: transactionWithMaybeGas,
  }) as React.ReactElement;
}
