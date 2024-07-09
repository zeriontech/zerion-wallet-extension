import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ethers } from 'ethers';
import { hashQueryKey, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client, type AddressAction } from 'defi-sdk';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { incomingTxToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
} from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
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
  hasGasEstimation,
  prepareGasAndNetworkFee,
} from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
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
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { PageBottom } from 'src/ui/components/PageBottom';
import {
  interpretSignature,
  interpretTransaction,
} from 'src/modules/ethereum/transactions/interpret';
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
  type SendTxBtnHandle,
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
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { NetworksSource } from 'src/modules/zerion-api/zerion-api';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { FEATURE_PAYMASTER_ENABLED } from 'src/env/config';
import { hasNetworkFee } from 'src/modules/ethereum/transactions/gasPrices/hasNetworkFee';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import { resolveChainId } from 'src/modules/ethereum/transactions/resolveChainId';
import { normalizeTransactionChainId } from 'src/modules/ethereum/transactions/normalizeTransactionChainId';
import { usePreferences } from 'src/ui/features/preferences';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { fetchAndAssignPaymaster } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { isDeviceAccount } from 'src/shared/types/validators';
import { shouldInterpretTransaction } from 'src/modules/ethereum/account-abstraction/shouldInterpretTransaction';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { RenderArea } from 'react-area';
import { TransactionConfiguration } from './TransactionConfiguration';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from './TransactionConfiguration/applyConfiguration';
import { TransactionAdvancedView } from './TransactionAdvancedView';
import { TransactionWarnings } from './TransactionWarnings';
import { txErrorToMessage } from './shared/transactionErrorToMessage';

async function configureTransactionToSign<T extends IncomingTransaction>(
  transaction: T,
  {
    transactionAction,
    allowanceQuantityBase,
    chain,
    networks,
    from,
    configuration,
    chainGasPrices,
  }: {
    transactionAction: TransactionAction;
    allowanceQuantityBase: string | null;
    chain: Chain;
    networks: Networks;
    from: string;
    configuration: CustomConfiguration;
    chainGasPrices: ChainGasPrice | null;
  }
): Promise<PartiallyRequired<T, 'chainId' | 'from'>> {
  let tx = { ...transaction } as T | IncomingTransaction;

  const chainId = transaction.chainId || networks.getChainId(chain);
  invariant(chainId, 'Could not resolve chainId for tx to sign');
  tx.chainId = chainId;

  if (transactionAction.type === 'approve' && allowanceQuantityBase) {
    tx = await walletPort.request('createApprovalTransaction', {
      chain: chain.toString(),
      contractAddress: transactionAction.contractAddress,
      allowanceQuantityBase,
      spender: transactionAction.spenderAddress,
    });
    tx.from = from;
    const gas = await estimateGas(tx, networks);
    tx.gasLimit = gas;
  }

  if (tx.value == null) {
    tx.value = '0x0';
  }

  if (FEATURE_PAYMASTER_ENABLED && tx.nonce == null) {
    // if {FEATURE_PAYMASTER} is disabled, we don't require nonce at this point. It will be fetched later anyway
    const { value: nonce } = await uiGetBestKnownTransactionCount({
      address: tx.from || from,
      chain,
      networks,
      defaultBlock: 'pending',
    });
    tx = { ...tx, nonce };
  }

  tx = applyConfiguration(tx, configuration, chainGasPrices);

  return tx as PartiallyRequired<T, 'chainId' | 'from'>;
}

async function resolveChain(
  transaction: IncomingTransaction,
  currentChain: Chain
): Promise<PartiallyRequired<IncomingTransaction, 'chainId'>> {
  const networksStore = await getNetworksStore();
  const txChainId = normalizeTransactionChainId(transaction);
  if (txChainId) {
    await networksStore.loadNetworksByChainId(txChainId); // side-effect: load this network into networks store
    return { ...transaction, chainId: txChainId };
  } else {
    const chain = currentChain.toString();
    const networks = await networksStore.load({ chains: [chain] }); // side-effect: load this network into networks store
    const chainId = networks.getChainId(currentChain);
    invariant(chainId, 'chainId should exist for resolving transaction');
    return { ...transaction, chainId };
  }
}

async function resolveGasAndFee(
  transaction: IncomingTransactionWithChainId,
  { source }: { source: NetworksSource }
) {
  const chainId = resolveChainId(transaction);
  const networksStore = await getNetworksStore();
  const networks = await networksStore.loadNetworksByChainId(chainId);
  return await prepareGasAndNetworkFee(transaction, networks, { source });
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
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const resolveGasQuery = useQuery({
    queryKey: ['resolveGasAndFee', withChainId, source],
    queryFn: async () =>
      withChainId ? resolveGasAndFee(withChainId, { source }) : null,
    enabled: Boolean(withChainId),
    useErrorBoundary: true,
    suspense: false,
  });
  return {
    /** popuLATERtrasaction - it's partially populated now and will get more data later :D */
    populatedTransaction: resolveGasQuery.data || withChainId || null,
  };
}

function useLocalAddressAction({
  address: from,
  transactionAction,
  transaction,
  networks,
}: {
  address: string;
  transactionAction: TransactionAction;
  transaction: IncomingTransactionWithChainId;
  networks: Networks;
}) {
  const client = useDefiSdkClient();
  const { currency } = useCurrency();
  return useQuery({
    queryKey: [
      'incomingTxToIncomingAddressAction',
      transaction,
      transactionAction,
      networks,
      from,
      client,
      currency,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () => {
      return incomingTxToIncomingAddressAction(
        { transaction: { ...transaction, from }, hash: '', timestamp: 0 },
        transactionAction,
        networks,
        currency,
        client
      );
    },
    keepPreviousData: true,
    useErrorBoundary: true,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

function useInterpretTransaction({
  transaction,
  address,
  origin,
  client,
  enabled = true,
}: {
  transaction: IncomingTransactionWithChainId;
  address: string;
  origin: string;
  client: Client;
  enabled?: boolean;
}) {
  const { currency } = useCurrency();
  return useQuery({
    queryKey: [
      'interpretTransaction',
      transaction,
      address,
      origin,
      currency,
      client,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () =>
      interpretTransaction({
        address,
        transaction,
        origin,
        client,
        currency,
      }),
    enabled,
    keepPreviousData: true,
    staleTime: 20000,
    suspense: false,
    retry: 1,
  });
}

enum View {
  default = 'default',
  customAllowance = 'customAllowance',
}

function TransactionDefaultView({
  networks,
  chain,
  origin,
  wallet,
  addressAction,
  singleAsset,
  allowanceQuantityBase,
  interpretation,
  interpretQuery,
  populatedTransaction,
  configuration,
  onConfigurationChange,
  paymasterEligible,
  onOpenAdvancedView,
  onFeeValueCommonReady,
}: {
  networks: Networks;
  chain: Chain;
  origin: string;
  wallet: ExternallyOwnedAccount;
  addressAction: AnyAddressAction;
  singleAsset: NonNullable<AddressAction['content']>['single_asset'];
  allowanceQuantityBase: string | null;
  interpretation: InterpretResponse | null | undefined;
  interpretQuery: {
    isInitialLoading: boolean;
    isError: boolean;
  };
  populatedTransaction: IncomingTransactionWithChainId;
  configuration: CustomConfiguration;
  onConfigurationChange: (value: CustomConfiguration) => void;
  paymasterEligible: boolean;
  onOpenAdvancedView: () => void;
  onFeeValueCommonReady: (value: string) => void;
}) {
  const { singleAddress } = useAddressParams();
  const [params] = useSearchParams();
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const allowanceViewHref = useMemo(
    () => `?${setURLSearchParams(params, { view: View.customAllowance })}`,
    [params]
  );

  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;

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
          showApplicationLine={true}
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
      {populatedTransaction && hasGasEstimation(populatedTransaction) ? (
        <>
          <ErrorBoundary renderError={() => null}>
            <React.Suspense fallback={null}>
              <TransactionWarnings
                address={singleAddress}
                addressAction={addressAction}
                transaction={populatedTransaction}
                chain={chain}
                networkFeeConfiguration={configuration.networkFee}
                paymasterElibible={paymasterEligible}
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
              {hasNetworkFee(populatedTransaction) ? (
                <React.Suspense
                  fallback={
                    <div style={{ display: 'flex', justifyContent: 'end' }}>
                      <CircleSpinner />
                    </div>
                  }
                >
                  <TransactionConfiguration
                    transaction={populatedTransaction}
                    from={wallet.address}
                    chain={chain}
                    onFeeValueCommonReady={onFeeValueCommonReady}
                    configuration={configuration}
                    onConfigurationChange={onConfigurationChange}
                    paymasterEligible={paymasterEligible}
                  />
                </React.Suspense>
              ) : null}
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
    </>
  );
}

function SendTransactionContent({
  incomingTransaction,
  populatedTransaction,
  origin,
  clientScope,
  wallet,
  networks,
  chain,
}: {
  incomingTransaction: IncomingTransaction;
  populatedTransaction: IncomingTransactionWithChainId;
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
  chain: Chain;
  networks: Networks;
}) {
  const [params] = useSearchParams();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { singleAddress } = useAddressParams();
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const { data: chainGasPrices } = useGasPrices(chain);

  const transactionAction = describeTransaction(populatedTransaction, {
    networks,
    chain,
  });

  const { data: localAddressAction, ...localAddressActionQuery } =
    useLocalAddressAction({
      address: singleAddress,
      transactionAction,
      transaction: populatedTransaction,
      networks,
    });

  const [allowanceQuantityBase, setAllowanceQuantityBase] = useState('');

  const configureTransactionToBeSigned = useEvent(
    async (transaction: IncomingTransaction) =>
      configureTransactionToSign(transaction, {
        chainGasPrices: chainGasPrices || null,
        configuration,
        allowanceQuantityBase,
        chain,
        from: singleAddress,
        networks,
        transactionAction,
      })
  );

  const isDeviceWallet = isDeviceAccount(wallet);
  const USE_PAYMASTER_FEATURE = FEATURE_PAYMASTER_ENABLED && !isDeviceWallet;

  const network = networks.getNetworkByName(chain) || null;

  const eligibilityQuery = useQuery({
    enabled: USE_PAYMASTER_FEATURE && network?.supports_sponsored_transactions,
    suspense: false,
    staleTime: 120000,
    queryKey: ['paymaster/check-eligibility', incomingTransaction],
    queryFn: async () => {
      const tx = await configureTransactionToBeSigned(incomingTransaction);
      return ZerionAPI.checkPaymasterEligibility(tx);
    },
  });

  const paymasterEligible = Boolean(eligibilityQuery.data?.data.eligible);

  const client = useDefiSdkClient();

  const txInterpretQuery = useInterpretTransaction({
    transaction: populatedTransaction,
    address: singleAddress,
    origin,
    client,
    enabled: USE_PAYMASTER_FEATURE
      ? shouldInterpretTransaction({ network, eligibilityQuery })
      : true,
  });

  const paymasterTxInterpretQuery = useQuery({
    enabled: paymasterEligible,
    suspense: false,
    queryKey: [
      'interpret/typedData',
      populatedTransaction,
      chainGasPrices,
      configuration,
      allowanceQuantityBase,
      chain,
      singleAddress,
      networks,
      transactionAction,
      client,
      currency,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: async () => {
      const configuredTx = await configureTransactionToSign(
        populatedTransaction,
        {
          chainGasPrices: chainGasPrices || null,
          configuration,
          allowanceQuantityBase,
          chain,
          from: singleAddress,
          networks,
          transactionAction,
        }
      );
      const toSign = await fetchAndAssignPaymaster(configuredTx);
      const typedData = await walletPort.request('uiGetEip712Transaction', {
        transaction: toSign,
      });
      return interpretSignature({
        address: toSign.from,
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

  const interpretationHasCriticalWarning = hasCriticalWarning(
    interpretQuery.data?.warnings
  );

  const requestedAllowanceQuantityBase =
    interpretQuery.data?.action?.content?.single_asset?.quantity ||
    localAddressAction?.content?.single_asset?.quantity;
  const interpretAddressAction = interpretQuery.data?.action;

  const addressAction = interpretAddressAction || localAddressAction || null;

  const view = params.get('view') || View.default;
  const advancedDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const openAdvancedView = useCallback(() => {
    advancedDialogRef.current?.showModal();
  }, []);

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const next = params.get('next');
  function handleSentTransaction(tx: ethers.providers.TransactionResponse) {
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    windowPort.confirm(windowId, tx.hash);
    if (next) {
      navigate(next);
    }
  }

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const { mutate: sendTransaction, ...sendTransactionMutation } = useMutation({
    mutationFn: async () => {
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      let tx = await configureTransactionToBeSigned(populatedTransaction);
      if (paymasterEligible) {
        tx = await fetchAndAssignPaymaster(tx);
      }
      if (USE_PAYMASTER_FEATURE) {
        console.log('sending to wallet', { tx });
      }
      const feeValueCommon = feeValueCommonRef.current || null;
      return sendTxBtnRef.current.sendTransaction({
        transaction: tx,
        chain: chain.toString(),
        feeValueCommon,
        initiator: origin,
        clientScope: clientScope || 'External Dapp',
        addressAction,
      });
    },
    onMutate: () => 'sendTransaction',
    onSuccess: (tx) => handleSentTransaction(tx),
  });

  if (localAddressActionQuery.isSuccess && !localAddressAction) {
    throw new Error('Unexpected missing localAddressAction');
  }

  if (!addressAction) {
    return null;
  }

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
            wallet={wallet}
            addressAction={addressAction}
            singleAsset={singleAsset}
            allowanceQuantityBase={
              allowanceQuantityBase || requestedAllowanceQuantityBase || null
            }
            interpretation={interpretQuery.data}
            interpretQuery={interpretQuery}
            populatedTransaction={populatedTransaction}
            configuration={configuration}
            onConfigurationChange={setConfiguration}
            paymasterEligible={paymasterEligible}
            onOpenAdvancedView={openAdvancedView}
            onFeeValueCommonReady={handleFeeValueCommonReady}
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
                interpretation={interpretQuery.data}
                // NOTE: Pass {populaterTransaction} or even "configured" transaction instead?
                transaction={incomingTransaction}
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
        <VStack style={{ textAlign: 'center' }} gap={8}>
          {sendTransactionMutation.isError ? (
            <UIText kind="body/regular" color="var(--negative-500)">
              {txErrorToMessage(sendTransactionMutation.error)}
            </UIText>
          ) : null}
          {view === View.customAllowance ? (
            <RenderArea name="sign-transaction-footer" />
          ) : (
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
                onClick={handleReject}
              >
                Cancel
              </Button>
              <SignTransactionButton
                // TODO: set loading state when {sendTransactionMutation.isLoading}
                // (important for paymaster flow)
                wallet={wallet}
                ref={sendTxBtnRef}
                onClick={() => sendTransaction()}
                isLoading={sendTransactionMutation.isLoading}
                disabled={sendTransactionMutation.isLoading}
                buttonKind={
                  interpretationHasCriticalWarning ? 'danger' : 'primary'
                }
                buttonTitle={
                  interpretationHasCriticalWarning
                    ? 'Proceed Anyway'
                    : undefined
                }
              />
            </div>
          )}
        </VStack>
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
  const transactionStringified = params.get('transaction');
  invariant(
    transactionStringified,
    'transaction get-parameter is required for this view'
  );
  const origin = params.get('origin');
  invariant(origin, 'origin get-parameter is required for this view');
  const incomingTransaction = useMemo(
    () => JSON.parse(transactionStringified) as IncomingTransaction,
    [transactionStringified]
  );

  // NOTE: this hook populates {networks} with a network for resolved chainId
  // This is why the {networks} object has necessary data, but it's very implicit.
  const { populatedTransaction } = usePreparedTx(incomingTransaction, origin);
  const { networks } = useNetworks();

  if (isLoading || !wallet || !networks || !populatedTransaction) {
    return null;
  }
  const chainId = normalizeChainId(populatedTransaction.chainId);
  const chain = chainId ? networks.getChainById(chainId) : null;
  invariant(chain, 'Could not resolve network or chainId');

  const clientScope = params.get('clientScope');

  return (
    <SendTransactionContent
      incomingTransaction={incomingTransaction}
      populatedTransaction={populatedTransaction}
      origin={origin}
      clientScope={clientScope}
      wallet={wallet}
      chain={chain}
      networks={networks}
    />
  );
}
