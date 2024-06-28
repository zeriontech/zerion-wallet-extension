import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SendFormView } from '@zeriontech/transactions';
import { TransactionConfirmationView } from 'src/ui/components/address-action/TransactionConfirmationView';
import { walletPort } from 'src/ui/shared/channels';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import type { EligibilityQuery } from 'src/modules/ethereum/account-abstraction/shouldInterpretTransaction';

const QUERY_KEY = ['configureSendTransaction'];

export function SendTransactionConfirmation({
  sendView,
  getTransaction,
  chain,
  paymasterEligible,
  eligibilityQuery,
}: {
  sendView: SendFormView;
  getTransaction: () => Promise<Partial<IncomingTransactionWithChainId>>;
  chain: Chain;
  paymasterEligible: boolean;
  eligibilityQuery: EligibilityQuery;
}) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { data: transaction } = useQuery({
    suspense: false, // "true" makes confirmation dialog flicker
    queryKey: QUERY_KEY,
    queryFn: getTransaction,
    useErrorBoundary: true,
  });
  useEffect(() => {
    return () => {
      // Because `getTransaction` is effectively stateful (clojured),
      // we have to manually clear cache from its result to avoid showing stale data
      queryClient.removeQueries({ queryKey: QUERY_KEY });
    };
  }, []);

  if (!wallet || !transaction) {
    return null;
  }
  invariant(transaction.chainId, 'transaction must have a chainId');

  return (
    <TransactionConfirmationView
      title="Send"
      wallet={wallet}
      showApplicationLine={false}
      chain={chain}
      transaction={transaction as IncomingTransactionWithChainId}
      configuration={sendView.store.configuration.getState()}
      paymasterEligible={paymasterEligible}
      eligibilityQuery={eligibilityQuery}
    />
  );
}
