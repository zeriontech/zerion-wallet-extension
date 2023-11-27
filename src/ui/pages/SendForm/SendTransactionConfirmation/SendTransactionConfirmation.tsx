import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SendFormView } from '@zeriontech/transactions';
import { TransactionConfirmationView } from 'src/ui/components/address-action/TransactionConfirmationView';
import { walletPort } from 'src/ui/shared/channels';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';

export function SendTransactionConfirmation({
  sendView,
  getTransaction,
  chain,
}: {
  sendView: SendFormView;
  getTransaction: () => Promise<Partial<IncomingTransactionWithChainId>>;
  chain: Chain;
}) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  const { data: transaction } = useQuery({
    queryKey: ['configureSendTransaction'],
    queryFn: getTransaction,
    useErrorBoundary: true,
  });
  if (!wallet || !transaction) {
    return null;
  }
  invariant(transaction.chainId, 'transaction must have a chainId');

  return (
    <TransactionConfirmationView
      title={'Send'}
      wallet={wallet}
      chain={chain}
      transaction={transaction as IncomingTransactionWithChainId}
      configuration={sendView.store.configuration.getState()}
    />
  );
}
