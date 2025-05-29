import React, { useRef } from 'react';
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
import { walletPort } from 'src/ui/shared/channels';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { useInterpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import { InterpretationSecurityCheck } from 'src/ui/shared/security-check/InterpertationSecurityCheck';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TransactionAdvancedView } from 'src/ui/pages/SendTransaction/TransactionAdvancedView';
import type { PopoverToastHandle } from 'src/ui/pages/Settings/PopoverToast';
import { PopoverToast } from 'src/ui/pages/Settings/PopoverToast';
import ScrollIcon from 'jsx:src/ui/assets/scroll.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { AddressActionDetails } from '../AddressActionDetails';

export function TransactionSimulation({
  address,
  transaction,
  txInterpretQuery,
  customAllowanceValueBase,
  showApplicationLine,
  onOpenAllowanceForm,
}: {
  address: string;
  transaction: IncomingTransactionWithChainId;
  txInterpretQuery: ReturnType<typeof useInterpretTxBasedOnEligibility>;
  customAllowanceValueBase?: string;
  showApplicationLine: boolean;
  onOpenAllowanceForm?: () => void;
}) {
  const advancedDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const toastRef = useRef<PopoverToastHandle>(null);

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

  const interpretation = txInterpretQuery.data;

  const interpretAddressAction = interpretation?.action;
  const addressAction = interpretAddressAction || localAddressAction;
  if (!addressAction || !chain || !networks || !wallet) {
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
    <>
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Copied to Clipboard
      </PopoverToast>
      <CenteredDialog
        ref={advancedDialogRef}
        containerStyle={{ paddingBottom: 0 }}
        renderWhenOpen={() => (
          <>
            <DialogTitle
              title={<UIText kind="body/accent">Details</UIText>}
              closeKind="icon"
            />
            <TransactionAdvancedView
              networks={networks}
              chain={chain}
              interpretation={interpretation}
              // NOTE: Pass {populaterTransaction} or even "configured" transaction instead?
              transaction={transaction}
              addressAction={addressAction}
              onCopyData={() => toastRef.current?.showToast()}
            />
          </>
        )}
      />
      <VStack gap={8}>
        <AddressActionDetails
          address={wallet.address}
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
        <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <InterpretationSecurityCheck
            interpretation={interpretation}
            interpretQuery={txInterpretQuery}
          />
          <Button
            type="button"
            kind="regular"
            onClick={() => advancedDialogRef.current?.showModal()}
            size={44}
            className="parent-hover"
            style={{
              textAlign: 'start',
              borderRadius: 100,
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            <HStack gap={0} alignItems="center" justifyContent="center">
              <ScrollIcon />
              <span>Details</span>
              <ArrowDownIcon
                className="content-hover"
                style={{ width: 24, height: 24 }}
              />
            </HStack>
          </Button>
        </HStack>
        <RenderArea name="transaction-warning-section" />
      </VStack>
    </>
  );
}
