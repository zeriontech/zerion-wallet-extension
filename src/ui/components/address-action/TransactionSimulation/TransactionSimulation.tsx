import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useQuery } from '@tanstack/react-query';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { describeTransaction } from 'src/modules/ethereum/transactions/describeTransaction';
import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import { incomingTxToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { interpretTransaction } from 'src/modules/ethereum/transactions/interpret';
import { walletPort } from 'src/ui/shared/channels';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Content } from 'react-area';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { InterpretLoadingState } from '../../InterpretLoadingState';
import { AddressActionDetails } from '../AddressActionDetails';

export function TransactionSimulation({
  vGap = 16,
  address,
  transaction,
  localAllowanceQuantityBase,
  onOpenAllowanceForm,
}: {
  vGap?: number;
  address: string;
  transaction: IncomingTransactionWithChainId;
  localAllowanceQuantityBase?: string;
  onOpenAllowanceForm?: () => void;
}) {
  const { networks } = useNetworks();
  invariant(transaction.chainId, 'transaction must have a chainId value');

  const chain = networks?.getChainById(valueToHex(transaction.chainId));

  // TODO: "wallet" must not be used here,
  // instead, a sender address must be taken from AddressAction
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const transactionAction =
    transaction && networks && chain
      ? describeTransaction(transaction, {
          networks,
          chain,
        })
      : null;

  const { data: localAddressAction } = useQuery({
    queryKey: [
      'incomingTxToIncomingAddressAction',
      transaction,
      transactionAction,
      networks,
      address,
    ],
    queryFn: () => {
      return transaction && networks && transactionAction
        ? incomingTxToIncomingAddressAction(
            {
              transaction: { ...transaction, from: address },
              hash: '',
              timestamp: 0,
            },
            transactionAction,
            networks
          )
        : null;
    },
    staleTime: Infinity,
    keepPreviousData: true,
    enabled:
      Boolean(transaction) && Boolean(networks) && Boolean(transactionAction),
    useErrorBoundary: true,
  });

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: ['interpretTransaction', transaction],
    queryFn: () => {
      invariant(transaction.from, 'transaction must have a from value');
      return interpretTransaction(transaction.from, transaction);
    },
    // enabled: Boolean(incomingTxWithGasAndFee),
    keepPreviousData: true,
    staleTime: 20000,
    suspense: false,
    retry: 1,
  });

  const interpretAddressAction = interpretation?.action;
  const addressAction = interpretAddressAction || localAddressAction;
  if (!addressAction || !chain || !networks || !wallet) {
    return <p>loading...</p>;
  }
  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;
  const singleAsset = addressAction.content?.single_asset;

  const allowanceQuantityBase = interpretQuery.isFetching
    ? localAllowanceQuantityBase
    : addressAction.content?.single_asset?.quantity;

  return (
    <VStack gap={vGap}>
      <AddressActionDetails
        recipientAddress={recipientAddress}
        addressAction={addressAction}
        chain={chain}
        networks={networks}
        wallet={wallet}
        actionTransfers={actionTransfers}
        singleAsset={singleAsset}
        allowanceQuantityBase={allowanceQuantityBase}
      />
      {allowanceQuantityBase && onOpenAllowanceForm ? (
        <Content name="single-asset-quantity-right">
          <UnstyledButton type="button" onClick={onOpenAllowanceForm}>
            <UIText kind="small/accent" color="var(--primary)">
              Edit
            </UIText>
          </UnstyledButton>
        </Content>
      ) : null}
      {interpretQuery.isLoading ? (
        <InterpretLoadingState />
      ) : interpretQuery.isError ? (
        <UIText kind="small/regular" color="var(--notice-600)">
          Unable to analyze the details of the transaction
        </UIText>
      ) : null}
    </VStack>
  );
}
