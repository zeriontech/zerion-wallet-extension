import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { RenderArea } from 'react-area';
import { Client } from 'defi-sdk';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { describeTransaction } from 'src/modules/ethereum/transactions/describeTransaction';
import { incomingTxToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { useInterpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { parseSolanaTransaction } from 'src/modules/solana/transactions/parseSolanaTransaction';
import { solFromBase64 } from 'src/modules/solana/transactions/create';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { Chain } from 'src/modules/networks/Chain';
import { InterpretationState } from '../../InterpretationState';
import { AddressActionDetails } from '../AddressActionDetails';

function useLocalAddressAction({
  address,
  chain,
  transaction,
}: {
  address: string;
  chain: Chain;
  transaction: MultichainTransaction;
}) {
  const { currency } = useCurrency();
  const client = useDefiSdkClient();
  return useQuery({
    queryKey: [
      'incomingTxToIncomingAddressAction',
      transaction,
      address,
      currency,
      client,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: async () => {
      if (typeof transaction.solana === 'string') {
        return parseSolanaTransaction(
          address,
          solFromBase64(transaction.solana)
        );
      } else {
        const tx = transaction.evm;
        const networksStore = await getNetworksStore();
        const networks = await networksStore.load({
          chains: [chain.toString()],
        });
        const transactionAction = describeTransaction(tx, { networks, chain });
        return incomingTxToIncomingAddressAction(
          { transaction: { ...tx, from: address }, hash: '', timestamp: 0 },
          transactionAction,
          networks,
          currency,
          client
        );
      }
    },
    staleTime: Infinity,
    keepPreviousData: true,
    useErrorBoundary: true,
  });
}

export function TransactionSimulation({
  vGap = 16,
  address,
  transaction,
  chain,
  txInterpretQuery,
  customAllowanceValueBase,
  showApplicationLine,
  onOpenAllowanceForm,
}: {
  vGap?: number;
  address: string;
  transaction: MultichainTransaction;
  chain: Chain;
  txInterpretQuery: ReturnType<typeof useInterpretTxBasedOnEligibility>;
  customAllowanceValueBase?: string;
  showApplicationLine: boolean;
  onOpenAllowanceForm?: () => void;
}) {
  const { networks } = useNetworks();

  const { data: localAddressAction } = useLocalAddressAction({
    address,
    transaction,
    chain,
  });

  const interpretation = txInterpretQuery.data;

  const interpretAddressAction = interpretation?.action;
  const addressAction = interpretAddressAction || localAddressAction;
  if (!addressAction || !networks) {
    return <p>loading...</p>;
  }
  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;
  const singleAsset = addressAction.content?.single_asset;

  // TODO: what if network doesn't support simulations (txInterpretQuery is idle or isError),
  // but this is an approval tx? Can there be a bug?
  const allowanceQuantityBase =
    customAllowanceValueBase || addressAction.content?.single_asset?.quantity;

  return (
    <VStack gap={vGap}>
      <AddressActionDetails
        address={address}
        recipientAddress={recipientAddress}
        addressAction={addressAction}
        chain={chain}
        networks={networks}
        actionTransfers={actionTransfers}
        singleAsset={singleAsset}
        allowanceQuantityBase={allowanceQuantityBase || null}
        showApplicationLine={showApplicationLine}
        singleAssetElementEnd={
          allowanceQuantityBase && onOpenAllowanceForm ? (
            <UIText kind="small/accent" color="var(--primary)">
              <UnstyledButton
                type="button"
                className="hover:underline"
                onClick={onOpenAllowanceForm}
              >
                Edit
              </UnstyledButton>
            </UIText>
          ) : null
        }
      />
      <InterpretationState
        interpretation={interpretation}
        interpretQuery={txInterpretQuery}
      />
      <RenderArea name="transaction-warning-section" />
    </VStack>
  );
}
