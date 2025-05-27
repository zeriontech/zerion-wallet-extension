import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TransactionConfirmationView } from 'src/ui/components/address-action/TransactionConfirmationView';
import { walletPort } from 'src/ui/shared/channels';
import { createChain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SendFormState } from '../shared/SendFormState';
import { toConfiguration } from '../shared/helpers';

export function SendTransactionConfirmation({
  transaction,
  paymasterEligible,
  paymasterPossible,
  onGasbackReady,
  formState,
}: {
  transaction: MultichainTransaction;
  formState: SendFormState;
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  onGasbackReady: null | ((value: number) => void);
}) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const chain = formState.tokenChain ? createChain(formState.tokenChain) : null;
  invariant(chain, 'Chain must be set');

  if (!wallet || !transaction) {
    return null;
  }

  return (
    <TransactionConfirmationView
      title="Send"
      wallet={wallet}
      showApplicationLine={false}
      chain={chain}
      transaction={transaction}
      configuration={toConfiguration(formState)}
      paymasterEligible={paymasterEligible}
      paymasterPossible={paymasterPossible}
      eligibilityQuery={{
        isError: false,
        status: 'success',
        data: {
          data: {
            eligible: Boolean(transaction.evm?.customData?.paymasterParams),
          },
        },
      }}
      onGasbackReady={onGasbackReady}
    />
  );
}
