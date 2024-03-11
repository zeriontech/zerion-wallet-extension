import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Content, RenderArea } from 'react-area';
import type { AddressAction } from 'defi-sdk';
import type { IncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { incomingTxToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
} from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Background } from 'src/ui/components/Background';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import {
  estimateGas,
  prepareGasAndNetworkFee,
} from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { resolveChainForTx } from 'src/modules/ethereum/transactions/resolveChainForTx';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { networksStore } from 'src/modules/networks/networks-store.client';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { PageBottom } from 'src/ui/components/PageBottom';
import { interpretTransaction } from 'src/modules/ethereum/transactions/interpret';
import type { Networks } from 'src/modules/networks/Networks';
import type { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';
import { describeTransaction } from 'src/modules/ethereum/transactions/describeTransaction';
import { AllowanceView } from 'src/ui/components/AllowanceView';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useEvent } from 'src/ui/shared/useEvent';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import {
  SignTransactionButton,
  type SignerSenderHandle,
} from 'src/ui/components/SignTransactionButton';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { InterpretationState } from 'src/ui/components/InterpretationState';
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import { hasCriticalWarning } from 'src/ui/components/InterpretationState/InterpretationState';
import { TransactionConfiguration } from './TransactionConfiguration';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from './TransactionConfiguration/applyConfiguration';
import { TransactionAdvancedView } from './TransactionAdvancedView';
import { TransactionWarnings } from './TransactionWarnings';
import { txErrorToMessage } from './shared/transactionErrorToMessage';

async function resolveChain(
  transaction: IncomingTransaction,
  currentChain: Chain
): Promise<PartiallyRequired<IncomingTransaction, 'chainId'>> {
  const networks = await networksStore.load();
  const chain = resolveChainForTx(transaction, currentChain, networks);
  const chainId = networks.getChainId(chain);
  return { ...transaction, chainId };
}

async function resolveGasAndFee(transaction: IncomingTransactionWithChainId) {
  const networks = await networksStore.load();
  return await prepareGasAndNetworkFee(transaction, networks);
}

function usePreparedTx(transaction: IncomingTransaction, origin: string) {
  /**
   * We _cannot_ proceed without resolving chain id,
   * but we _can_ proceed without resolving network fee.
   * This is why one query uses suspense: true and another suspense: false
   */
  const resolveChainQuery = useQuery({
    queryKey: ['resolveChain', transaction, origin],
    queryFn: async () => {
      const currentChain = await walletPort.request('requestChainForOrigin', {
        origin,
      });
      return resolveChain(transaction, createChain(currentChain));
    },
  });
  const withChainId = resolveChainQuery.data;
  const resolveGasQuery = useQuery({
    queryKey: ['resolveGasAndFee', withChainId],
    queryFn: async () => (withChainId ? resolveGasAndFee(withChainId) : null),
    enabled: Boolean(withChainId),
    useErrorBoundary: true,
    suspense: false,
  });
  return {
    incomingTxWithChainId: withChainId,
    incomingTxWithGasAndFee: resolveGasQuery.data,
  };
}

enum View {
  default = 'default',
  customAllowance = 'customAllowance',
}

function TransactionDefaultView({
  networks,
  chain,
  origin,
  clientScope,
  wallet,
  addressAction,
  transactionAction,
  singleAsset,
  allowanceQuantityBase,
  interpretation,
  interpretQuery,
  incomingTransaction,
  incomingTxWithGasAndFee,
  onOpenAdvancedView,
  onReject,
}: {
  networks: Networks;
  chain: Chain;
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
  addressAction: AddressAction | IncomingAddressAction;
  transactionAction: TransactionAction;
  singleAsset: NonNullable<AddressAction['content']>['single_asset'];
  allowanceQuantityBase?: string;
  interpretation: InterpretResponse | null | undefined;
  interpretQuery: {
    isInitialLoading: boolean;
    isError: boolean;
  };
  incomingTransaction: IncomingTransaction;
  incomingTxWithGasAndFee?: IncomingTransactionWithChainId | null;
  onOpenAdvancedView: () => void;
  onReject: () => void;
}) {
  const navigate = useNavigate();
  const { singleAddress } = useAddressParams();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const { data: chainGasPrices } = useGasPrices(chain);
  const allowanceViewHref = useMemo(
    () => `?${setURLSearchParams(params, { view: View.customAllowance })}`,
    [params]
  );

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const configureTransactionToBeSigned = useEvent(
    async (transaction: IncomingTransaction) => {
      let tx = transaction;

      if (transactionAction.type === 'approve' && allowanceQuantityBase) {
        tx = await walletPort.request('createApprovalTransaction', {
          chain: chain.toString(),
          contractAddress: transactionAction.contractAddress,
          allowanceQuantityBase,
          spender: transactionAction.spenderAddress,
        });
        tx.chainId = networks.getChainId(chain);
        tx.from = singleAddress;
        const gas = await estimateGas(tx, networks);
        tx.gasLimit = gas;
      }

      const txToSign = applyConfiguration(tx, configuration, chainGasPrices);
      return txToSign;
    }
  );

  function handleSentTransaction(tx: ethers.providers.TransactionResponse) {
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    windowPort.confirm(windowId, tx.hash);
    if (next) {
      navigate(next);
    }
  }

  const signerSenderRef = useRef<SignerSenderHandle | null>(null);

  const { mutate: sendTransaction, ...sendTransactionMutation } = useMutation({
    mutationFn: async () => {
      invariant(signerSenderRef.current, 'SignTransactionButton not found');
      const tx = await configureTransactionToBeSigned(
        incomingTxWithGasAndFee || incomingTransaction
      );
      const feeValueCommon = feeValueCommonRef.current || null;
      return signerSenderRef.current.sendTransaction({
        transaction: tx,
        chain: chain.toString(),
        feeValueCommon,
        initiator: origin,
        clientScope: clientScope || 'External Dapp',
        addressAction: null,
      });
    },
    onMutate: () => 'sendTransaction',
    onSuccess: (tx) => handleSentTransaction(tx),
  });

  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;
  const interpretationHasCriticalWarning = hasCriticalWarning(
    interpretation?.warnings
  );

  return (
    <>
      <PageTop />
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
          {addressAction.type.display_value}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {origin === INTERNAL_ORIGIN ? (
            'Zerion'
          ) : originForHref ? (
            <TextAnchor
              // Open URL in a new _window_ so that extension UI stays open and visible
              onClick={openInNewWindow}
              href={originForHref.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {originForHref.hostname}
            </TextAnchor>
          ) : (
            'Unknown Initiator'
          )}
        </UIText>
        <Spacer height={8} />
        <HStack gap={8} alignItems="center">
          <WalletAvatar
            address={wallet.address}
            size={20}
            active={false}
            borderRadius={4}
          />
          <UIText kind="small/regular">
            <WalletDisplayName wallet={wallet} />
          </UIText>
        </HStack>
      </div>
      <Spacer height={24} />
      <VStack gap={16}>
        <AddressActionDetails
          recipientAddress={recipientAddress}
          addressAction={addressAction}
          chain={chain}
          networks={networks}
          wallet={wallet}
          actionTransfers={actionTransfers}
          singleAsset={singleAsset}
          allowanceQuantityBase={allowanceQuantityBase}
          singleAssetElementEnd={
            allowanceQuantityBase && addressAction.type.value === 'approve' ? (
              <UIText
                as={TextLink}
                kind="small/accent"
                style={{ color: 'var(--primary)' }}
                to={allowanceViewHref}
              >
                Edit
              </UIText>
            ) : null
          }
        />
        <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <InterpretationState
            interpretation={interpretation}
            interpretQuery={interpretQuery}
          />
          <Button kind="regular" size={36} onClick={onOpenAdvancedView}>
            Advanced View
          </Button>
        </HStack>
      </VStack>
      <Spacer height={16} />
      {incomingTxWithGasAndFee ? (
        <>
          <ErrorBoundary renderError={() => null}>
            <React.Suspense fallback={null}>
              <TransactionWarnings
                address={singleAddress}
                addressAction={addressAction}
                transaction={incomingTxWithGasAndFee}
                chain={chain}
                networkFeeConfiguration={configuration.networkFee}
              />
              <Spacer height={16} />
            </React.Suspense>
          </ErrorBoundary>
          <div style={{ marginTop: 'auto' }}>
            <ErrorBoundary
              renderError={() => (
                <UIText kind="body/regular">
                  <span style={{ display: 'inline-block' }}>
                    <WarningIcon />
                  </span>{' '}
                  Failed to load network fee
                </UIText>
              )}
            >
              <React.Suspense
                fallback={
                  <div style={{ display: 'flex', justifyContent: 'end' }}>
                    <CircleSpinner />
                  </div>
                }
              >
                <TransactionConfiguration
                  transaction={incomingTxWithGasAndFee}
                  from={wallet.address}
                  chain={chain}
                  onFeeValueCommonReady={handleFeeValueCommonReady}
                  configuration={configuration}
                  onConfigurationChange={setConfiguration}
                />
              </React.Suspense>
            </ErrorBoundary>
          </div>
        </>
      ) : (
        <DelayedRender delay={2000}>
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <CircleSpinner />
          </div>
        </DelayedRender>
      )}
      <Content name="sign-transaction-footer">
        <VStack style={{ textAlign: 'center' }} gap={8}>
          {sendTransactionMutation.isError ? (
            <UIText kind="body/regular" color="var(--negative-500)">
              {txErrorToMessage(sendTransactionMutation.error)}
            </UIText>
          ) : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: interpretationHasCriticalWarning
                ? '1fr'
                : '1fr 1fr',
              gap: 8,
            }}
          >
            <Button
              ref={focusNode}
              kind={interpretationHasCriticalWarning ? 'primary' : 'regular'}
              type="button"
              onClick={onReject}
            >
              Cancel
            </Button>
            <SignTransactionButton
              wallet={wallet}
              ref={signerSenderRef}
              onClick={() => sendTransaction()}
              kind={interpretationHasCriticalWarning ? 'danger' : 'primary'}
              buttonTitle={
                interpretationHasCriticalWarning ? 'Proceed Anyway' : undefined
              }
            />
          </div>
        </VStack>
      </Content>
    </>
  );
}

function SendTransactionContent({
  transactionStringified,
  origin,
  clientScope,
  wallet,
}: {
  transactionStringified: string;
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
}) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { singleAddress } = useAddressParams();
  const incomingTransaction = useMemo(
    () => JSON.parse(transactionStringified) as IncomingTransaction,
    [transactionStringified]
  );
  const { networks } = useNetworks();
  const { incomingTxWithChainId, incomingTxWithGasAndFee } = usePreparedTx(
    incomingTransaction,
    origin
  );

  const transaction = incomingTxWithGasAndFee || incomingTxWithChainId;

  const chain =
    transaction && networks
      ? networks.getChainById(ethers.utils.hexValue(transaction.chainId))
      : null;

  const transactionAction =
    transaction && networks && chain
      ? describeTransaction(transaction, {
          networks,
          chain,
        })
      : null;

  const { data: localAddressAction, ...localAddressActionQuery } = useQuery({
    queryKey: [
      'incomingTxToIncomingAddressAction',
      transaction,
      transactionAction,
      networks,
      singleAddress,
    ],
    queryFn: () => {
      return transaction && networks && transactionAction
        ? incomingTxToIncomingAddressAction(
            {
              transaction: { ...transaction, from: singleAddress },
              hash: '',
              timestamp: 0,
            },
            transactionAction,
            networks
          )
        : null;
    },
    keepPreviousData: true,
    enabled:
      Boolean(transaction) && Boolean(networks) && Boolean(transactionAction),
    useErrorBoundary: true,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: [
      'interpretTransaction',
      incomingTxWithGasAndFee,
      singleAddress,
      origin,
    ],
    queryFn: () => {
      return incomingTxWithGasAndFee
        ? interpretTransaction({
            address: singleAddress,
            transaction: incomingTxWithGasAndFee,
            origin,
          })
        : null;
    },
    enabled: Boolean(incomingTxWithGasAndFee),
    keepPreviousData: true,
    staleTime: 20000,
    suspense: false,
    retry: 1,
  });

  const requestedAllowanceQuantityBase =
    interpretation?.action?.content?.single_asset?.quantity ||
    localAddressAction?.content?.single_asset?.quantity;

  const [allowanceQuantityBase, setAllowanceQuantityBase] = useState('');

  const interpretAddressAction = interpretation?.action;

  const view = params.get('view') || View.default;
  const advancedDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const openAdvancedView = useCallback(() => {
    advancedDialogRef.current?.showModal();
  }, []);

  if (localAddressActionQuery.isSuccess && !localAddressAction) {
    throw new Error('Unexpected missing localAddressAction');
  }

  if (!networks || !chain || !transactionAction || !localAddressAction) {
    return null;
  }

  const addressAction = interpretAddressAction || localAddressAction;
  const singleAsset = addressAction?.content?.single_asset;

  const handleChangeAllowance = (value: string) => {
    setAllowanceQuantityBase(value);
    navigate(-1);
  };

  const handleReject = () => {
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    windowPort.reject(windowId);
    navigate(-1);
  };

  return (
    <Background backgroundKind="white">
      <NavigationTitle title={null} documentTitle="Send Transaction" />
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {view === View.default ? (
          <TransactionDefaultView
            networks={networks}
            chain={chain}
            origin={origin}
            clientScope={clientScope}
            wallet={wallet}
            transactionAction={transactionAction}
            addressAction={addressAction}
            singleAsset={singleAsset}
            allowanceQuantityBase={
              allowanceQuantityBase || requestedAllowanceQuantityBase
            }
            interpretation={interpretation}
            interpretQuery={interpretQuery}
            incomingTransaction={incomingTransaction}
            incomingTxWithGasAndFee={incomingTxWithGasAndFee}
            onOpenAdvancedView={openAdvancedView}
            onReject={handleReject}
          />
        ) : null}
        <CenteredDialog
          ref={advancedDialogRef}
          containerStyle={{ paddingBottom: 0 }}
          renderWhenOpen={() => (
            <>
              <DialogTitle title="Advanced View" closeKind="icon" />
              <TransactionAdvancedView
                networks={networks}
                chain={chain}
                interpretation={interpretation}
                transaction={incomingTransaction}
                transactionStringified={transactionStringified}
              />
            </>
          )}
        ></CenteredDialog>
        {view === View.customAllowance ? (
          <AllowanceView
            address={wallet.address}
            asset={getFungibleAsset(singleAsset?.asset)}
            requestedAllowanceQuantityBase={requestedAllowanceQuantityBase}
            value={allowanceQuantityBase}
            chain={chain}
            onChange={handleChangeAllowance}
          />
        ) : null}
        <Spacer height={16} />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={16} />
        <RenderArea name="sign-transaction-footer" />
        <PageBottom />
      </PageStickyFooter>
    </Background>
  );
}

export function SendTransaction() {
  const [params] = useSearchParams();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  if (isLoading || !wallet) {
    return null;
  }

  const origin = params.get('origin');
  const clientScope = params.get('clientScope');
  invariant(origin, 'origin get-parameter is required for this view');

  const transactionStringified = params.get('transaction');
  invariant(
    transactionStringified,
    'transaction get-parameter is required for this view'
  );

  return (
    <SendTransactionContent
      transactionStringified={transactionStringified}
      origin={origin}
      clientScope={clientScope}
      wallet={wallet}
    />
  );
}
