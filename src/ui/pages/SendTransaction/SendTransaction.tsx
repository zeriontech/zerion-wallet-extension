import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useBackgroundKind } from 'src/ui/components/Background';
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
import type { InterpretResponse } from 'src/modules/ethereum/transactions/types';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { hasNetworkFee } from 'src/modules/ethereum/transactions/gasPrices/hasNetworkFee';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import { resolveChainId } from 'src/modules/ethereum/transactions/resolveChainId';
import { normalizeTransactionChainId } from 'src/modules/ethereum/transactions/normalizeTransactionChainId';
import { usePreferences } from 'src/ui/features/preferences';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import {
  adjustedCheckEligibility,
  fetchAndAssignPaymaster,
} from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { RenderArea } from 'react-area';
import { wait } from 'src/shared/wait';
import { assertProp } from 'src/shared/assert-property';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { valueToHex } from 'src/shared/units/valueToHex';
import { useStaleTime } from 'src/ui/shared/useStaleTime';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import { solFromBase64 } from 'src/modules/solana/transactions/create';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { AddressActionComponent } from 'src/ui/components/address-action/AddressActionDetails/AddressActionDetails';
import { parseSolanaTransaction } from 'src/modules/solana/transactions/parseSolanaTransaction';
import {
  hasCriticalWarning,
  InterpretationSecurityCheck,
  SecurityStatusBackground,
} from 'src/ui/shared/security-check';
import ScrollIcon from 'jsx:src/ui/assets/scroll.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
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
    requireNonce,
  }: {
    transactionAction: TransactionAction;
    allowanceQuantityBase: string | null;
    chain: Chain;
    networks: Networks;
    from: string;
    configuration: CustomConfiguration;
    chainGasPrices: ChainGasPrice | null;
    requireNonce: boolean;
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

  if (requireNonce && tx.nonce == null) {
    const network = networks.getByNetworkId(chain);
    invariant(network, `Network not found for ${chain.toString}`);
    const { value: nonce } = await uiGetBestKnownTransactionCount({
      address: tx.from || from,
      network,
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
  return await prepareGasAndNetworkFee(transaction, networks, {
    source,
    apiClient: ZerionAPI,
  });
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
        standard: 'evm',
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
  paymasterPossible,
  paymasterWaiting,
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
  paymasterPossible: boolean;
  paymasterWaiting: boolean;
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
      <SecurityStatusBackground />
      <PageTop />
      <VStack gap={8}>
        <VStack
          gap={8}
          style={{
            justifyItems: 'center',
            paddingBlock: 24,
            border: '1px solid var(--neutral-300)',
            backgroundColor: '#ffffff40', // todo: use theme color
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
          }}
        >
          <SiteFaviconImg
            size={64}
            style={{ borderRadius: 16 }}
            url={origin}
            alt={`Logo for ${origin}`}
          />
          <UIText kind="headline/h2">{addressAction.type.display_value}</UIText>
          <UIText kind="small/accent" color="var(--neutral-500)">
            {origin === INTERNAL_ORIGIN ? (
              'Zerion'
            ) : originForHref ? (
              <TextAnchor
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
          <HStack gap={8} alignItems="center">
            <WalletAvatar
              address={wallet.address}
              size={20}
              active={false}
              borderRadius={6}
            />
            <UIText kind="small/regular">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          </HStack>
        </VStack>
        <VStack
          gap={4}
          style={{
            ['--surface-background-color' as string]: 'var(--neutral-100)',
          }}
        >
          <AddressActionDetails
            address={wallet.address}
            recipientAddress={recipientAddress}
            addressAction={addressAction}
            chain={chain}
            networks={networks}
            actionTransfers={actionTransfers}
            singleAsset={singleAsset}
            allowanceQuantityBase={allowanceQuantityBase}
            showApplicationLine={true}
            singleAssetElementEnd={
              allowanceQuantityBase &&
              addressAction.type.value === 'approve' ? (
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
        </VStack>
        <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <InterpretationSecurityCheck
            interpretation={interpretation}
            interpretQuery={interpretQuery}
          />
          <Button
            kind="regular"
            onClick={onOpenAdvancedView}
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
                paymasterEligible={paymasterEligible}
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
                    paymasterPossible={paymasterPossible}
                    paymasterWaiting={paymasterWaiting}
                    gasback={
                      interpretation?.action?.transaction.gasback != null
                        ? { value: interpretation.action.transaction.gasback }
                        : null
                    }
                    listViewTransitions={true}
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
  useBackgroundKind(whiteBackgroundKind);
  const [params] = useSearchParams();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { singleAddress } = useAddressParams();
  const { preferences } = usePreferences();
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const { data: chainGasPrices, ...gasPricesQuery } = useGasPrices(chain);

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
    async (
      transaction: IncomingTransaction,
      { requireNonce }: { requireNonce: boolean }
    ) =>
      configureTransactionToSign(transaction, {
        chainGasPrices: chainGasPrices || null,
        configuration,
        allowanceQuantityBase,
        chain,
        from: singleAddress,
        networks,
        transactionAction,
        requireNonce,
      })
  );

  const USE_PAYMASTER_FEATURE = true;

  const network = networks.getByNetworkId(chain) || null;
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';

  const paymasterPossible =
    USE_PAYMASTER_FEATURE && Boolean(network?.supports_sponsored_transactions);

  const eligibilityQuery = useQuery({
    // transaction gas type may change when gasPrices responds, so we should wait
    // to avoid inconsistency between paymasterCheckEligibility and getPaymasterParams calls
    enabled: paymasterPossible && gasPricesQuery.isFetched,
    suspense: false,
    staleTime: 120000,
    retry: 1,
    queryKey: ['paymaster/check-eligibility', populatedTransaction, source],
    queryFn: async () => {
      const tx = await configureTransactionToBeSigned(populatedTransaction, {
        requireNonce: true,
      });
      assertProp(tx, 'nonce');
      assertProp(tx, 'to');
      /** assume only EIP-1559 tx to be eligible */
      assertProp(tx, 'maxFeePerGas');
      assertProp(tx, 'maxPriorityFeePerGas');

      const gas = getGas(tx);
      invariant(gas, 'gasLimit missing');
      return adjustedCheckEligibility(
        { ...tx, gas: valueToHex(gas) },
        { source, apiClient: ZerionAPI }
      );
    },
  });

  const paymasterEligible = Boolean(eligibilityQuery.data?.data?.eligible);
  const { isStale } = useStaleTime(eligibilityQuery.isLoading, 2000);
  /** avoid a flash between network fee and "free" label, but not wait too long */
  const paymasterWaiting =
    paymasterPossible && eligibilityQuery.isLoading && !isStale;

  const client = useDefiSdkClient();

  const interpretQuery = useQuery({
    enabled: Boolean(network?.supports_simulations),
    // Failing to keepPreviousData currently may break AllowanceView
    // component because we will pass a nullish requestedAllowanceQuantityBase during refetch
    keepPreviousData: true,
    suspense: false,
    queryKey: [
      'interpretTxBasedOnEligibility',
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
      source,
      eligibilityQuery.data?.data.eligible,
      eligibilityQuery.status,
      origin,
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
          requireNonce: true,
        }
      );
      return interpretTxBasedOnEligibility({
        transaction: configuredTx,
        eligibilityQueryData: eligibilityQuery.data?.data.eligible,
        eligibilityQueryStatus: eligibilityQuery.status,
        currency,
        origin,
        client,
      });
    },
  });

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
  async function handleSentTransaction(res: SignTransactionResult) {
    if (preferences?.enableHoldToSignButton) {
      // small delay to show success state to the user before closing the popup
      await wait(500);
    }
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    invariant(res.evm, 'Ethereum response is expected');
    windowPort.confirm(windowId, res.evm.hash);
    if (next) {
      navigate(next);
    }
  }

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const { mutate: sendTransaction, ...sendTransactionMutation } = useMutation({
    mutationFn: async () => {
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      let tx = await configureTransactionToBeSigned(populatedTransaction, {
        requireNonce: paymasterEligible,
      });
      if (paymasterEligible) {
        tx = await fetchAndAssignPaymaster(tx, {
          source,
          apiClient: ZerionAPI,
        });
      }
      const feeValueCommon = feeValueCommonRef.current || null;
      return sendTxBtnRef.current.sendTransaction({
        transaction: { evm: tx },
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
    if (next) {
      navigate(next);
    }
  };

  return (
    <>
      <NavigationTitle title={null} documentTitle="Send Transaction" />
      <PageColumn>
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
            paymasterPossible={paymasterPossible}
            paymasterWaiting={paymasterWaiting}
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
              {preferences ? (
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
                  holdToSign={preferences.enableHoldToSignButton}
                />
              ) : null}
            </div>
          )}
        </VStack>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

function EthSendTransaction() {
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

function SolDefaultView({
  addressAction,
  origin,
  wallet,
}: {
  origin: string;
  addressAction: AnyAddressAction;
  wallet: ExternallyOwnedAccount;
}) {
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);
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
        <AddressActionComponent
          address={wallet.address}
          addressAction={addressAction}
          showApplicationLine={true}
        />
      </VStack>
    </>
  );
}

function assertKnownSolanaMethodParam(
  value: string | null
): asserts value is
  | 'signTransaction'
  | 'signAndSendTransaction'
  | 'signAllTransactions' {
  invariant(
    value === 'signTransaction' ||
      value === 'signAndSendTransaction' ||
      value === 'signAllTransactions',
    `Unsupported Solana method ${value}`
  );
}

function normalizeTxParams(params: URLSearchParams):
  | {
      method: 'signAllTransactions';
      transactions: StringBase64[];
      transaction: undefined;
    }
  | {
      method: 'signTransaction' | 'signAndSendTransaction';
      transactions: undefined;
      transaction: StringBase64;
    } {
  const method = params.get('method');
  assertKnownSolanaMethodParam(method);
  const base64Tx = params.get('transaction');
  const base64Txs = params.get('transactions');
  if (method === 'signAllTransactions') {
    invariant(base64Txs, 'signAllTransactions: transactions param is required');
    return {
      method,
      transaction: undefined,
      transactions: JSON.parse(base64Txs) as StringBase64[],
    };
  } else {
    invariant(base64Tx, 'transaction param is required');
    return {
      method,
      transaction: base64Tx as StringBase64,
      transactions: undefined,
    };
  }
}

function SolSendTransaction() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const clientScope = params.get('clientScope');
  const txParams = useMemo(() => normalizeTxParams(params), [params]);

  invariant(origin, 'origin get-parameter is required for this view');

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    suspense: true,
    useErrorBoundary: true,
  });
  invariant(wallet, 'Wallet must be available');
  const { preferences } = usePreferences();
  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const navigate = useNavigate();
  const next = params.get('next');

  async function handleSentTransaction(res: SignTransactionResult) {
    if (preferences?.enableHoldToSignButton) {
      // small delay to show success state to the user before closing the popup
      await wait(500);
    }
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    invariant(res.solana, 'Solana response is expected');
    windowPort.confirm(windowId, res.solana);
    if (next) {
      navigate(next);
    }
  }

  const handleReject = () => {
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    windowPort.reject(windowId);
    if (next) {
      navigate(next);
    }
  };

  const firstTx =
    txParams.method === 'signAllTransactions'
      ? txParams.transactions[0]
      : txParams.transaction;
  const addressAction = useMemo(
    () => parseSolanaTransaction(wallet.address, solFromBase64(firstTx)),
    [firstTx, wallet.address]
  );

  const { mutate: sendTransaction, ...sendTransactionMutation } = useMutation({
    mutationFn: async () => {
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      if (txParams.method === 'signAllTransactions') {
        return sendTxBtnRef.current.signAllTransactions({
          transaction: { solana: txParams.transactions },
          chain: 'solana',
          feeValueCommon: null,
          initiator: origin,
          clientScope: clientScope || 'External Dapp',
          method: txParams.method,
          addressAction,
        });
      } else {
        return sendTxBtnRef.current.sendTransaction({
          transaction: { solana: txParams.transaction },
          chain: 'solana',
          feeValueCommon: null,
          initiator: origin,
          clientScope: clientScope || 'External Dapp',
          method: txParams.method,
          addressAction,
        });
      }
    },
    onMutate: () => 'sendTransaction',
    onSuccess: (tx) => handleSentTransaction(tx),
  });

  useBackgroundKind(whiteBackgroundKind);

  return (
    <>
      <NavigationTitle title={null} documentTitle="Send Transaction" />
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        {addressAction ? (
          <SolDefaultView
            wallet={wallet}
            addressAction={addressAction}
            origin={origin}
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
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
          >
            <Button
              ref={focusNode}
              kind="regular"
              type="button"
              onClick={handleReject}
            >
              Cancel
            </Button>
            {preferences ? (
              <SignTransactionButton
                wallet={wallet}
                ref={sendTxBtnRef}
                onClick={() => sendTransaction()}
                isLoading={sendTransactionMutation.isLoading}
                disabled={sendTransactionMutation.isLoading}
                buttonKind="primary"
                holdToSign={preferences.enableHoldToSignButton}
              />
            ) : null}
          </div>
        </VStack>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

export function SendTransaction() {
  const [params] = useSearchParams();
  if (params.get('ecosystem') === 'solana') {
    return <SolSendTransaction />;
  } else {
    return <EthSendTransaction />;
  }
}
