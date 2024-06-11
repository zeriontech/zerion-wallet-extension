import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { RenderArea } from 'react-area';
import { Client } from 'defi-sdk';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { describeTransaction } from 'src/modules/ethereum/transactions/describeTransaction';
import { invariant } from 'src/shared/invariant';
import { incomingTxToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import {
  interpretSignature,
  interpretTransaction,
} from 'src/modules/ethereum/transactions/interpret';
import { walletPort } from 'src/ui/shared/channels';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { fetchAndAssignPaymaster } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { FEATURE_PAYMASTER_ENABLED } from 'src/env/config';
import type { EligibilityQuery } from 'src/modules/ethereum/account-abstraction/shouldInterpretTransaction';
import { shouldInterpretTransaction } from 'src/modules/ethereum/account-abstraction/shouldInterpretTransaction';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AddressActionDetails } from '../AddressActionDetails';
import { InterpretationState } from '../../InterpretationState';

export function TransactionSimulation({
  vGap = 16,
  address,
  transaction,
  paymasterEligible,
  eligibilityQuery,
  localAllowanceQuantityBase,
  showApplicationLine,
  onOpenAllowanceForm,
}: {
  vGap?: number;
  address: string;
  transaction: IncomingTransactionWithChainId;
  paymasterEligible: boolean;
  eligibilityQuery: EligibilityQuery;
  localAllowanceQuantityBase?: string;
  showApplicationLine: boolean;
  onOpenAllowanceForm?: () => void;
}) {
  const { networks } = useNetworks();
  const { currency } = useCurrency();
  invariant(transaction.chainId, 'transaction must have a chainId value');
  const chain = networks?.getChainById(normalizeChainId(transaction.chainId));

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

  const client = useDefiSdkClient();
  const { data: localAddressAction } = useQuery({
    queryKey: [
      'incomingTxToIncomingAddressAction',
      transaction,
      transactionAction,
      networks,
      address,
      currency,
      client,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () => {
      return transaction && networks && transactionAction
        ? incomingTxToIncomingAddressAction(
            {
              transaction: { ...transaction, from: address },
              hash: '',
              timestamp: 0,
            },
            transactionAction,
            networks,
            currency,
            client
          )
        : null;
    },
    staleTime: Infinity,
    keepPreviousData: true,
    enabled:
      Boolean(transaction) && Boolean(networks) && Boolean(transactionAction),
    useErrorBoundary: true,
  });

  const network = chain ? networks?.getNetworkByName(chain) || null : null;
  const txInterpretQuery = useQuery({
    enabled: FEATURE_PAYMASTER_ENABLED
      ? shouldInterpretTransaction({ network, eligibilityQuery })
      : true,
    queryKey: ['interpretTransaction', transaction, currency, client],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () => {
      invariant(transaction.from, 'transaction must have a from value');
      return interpretTransaction({
        address: transaction.from,
        transaction,
        origin: 'https://app.zerion.io',
        currency,
        client,
      });
    },
    keepPreviousData: true,
    staleTime: 20000,
    suspense: false,
    retry: 1,
  });

  const paymasterTxInterpretQuery = useQuery({
    enabled: paymasterEligible,
    suspense: false,
    queryKey: ['interpret/typedData', client, currency, transaction],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: async () => {
      invariant(transaction.from, 'transaction must have a from value');
      const toSign = await fetchAndAssignPaymaster(transaction);
      const typedData = await walletPort.request('uiGetEip712Transaction', {
        transaction: toSign,
      });
      return interpretSignature({
        address: transaction.from,
        chainId: normalizeChainId(toSign.chainId),
        typedData,
        client,
        currency,
      });
    },
  });

  const interpretQuery = paymasterEligible
    ? paymasterTxInterpretQuery
    : txInterpretQuery;

  const interpretation = interpretQuery.data;

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
        allowanceQuantityBase={allowanceQuantityBase || null}
        showApplicationLine={showApplicationLine}
        singleAssetElementEnd={
          allowanceQuantityBase && onOpenAllowanceForm ? (
            <UnstyledButton
              type="button"
              className="hover:underline"
              onClick={onOpenAllowanceForm}
            >
              <UIText kind="small/accent" color="var(--primary)">
                Edit
              </UIText>
            </UnstyledButton>
          ) : null
        }
      />
      <InterpretationState
        interpretation={interpretation}
        interpretQuery={interpretQuery}
      />
      <RenderArea name="transaction-warning-section" />
    </VStack>
  );
}
