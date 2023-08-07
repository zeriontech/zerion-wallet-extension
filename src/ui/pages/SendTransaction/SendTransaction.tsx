import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { capitalize } from 'capitalize-ts';
import { ethers } from 'ethers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { prepareGasAndNetworkFee } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { resolveChainForTx } from 'src/modules/ethereum/transactions/resolveChainForTx';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { interpretTransaction } from 'src/modules/ethereum/transactions/interpretTransaction';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { networksStore } from 'src/modules/networks/networks-store.client';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Surface } from 'src/ui/ui-kit/Surface';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { InterpretLoadingState } from 'src/ui/components/InterpretLoadingState';
import { AddressActionDetails } from 'src/ui/components/address-action/AddressActionDetails';
import { NavigationBar } from '../SignInWithEthereum/NavigationBar';
import { TransactionConfiguration } from './TransactionConfiguration';
import type { CustomConfiguration } from './TransactionConfiguration';
import { applyConfiguration } from './TransactionConfiguration/applyConfiguration';

type SendTransactionError =
  | null
  | Error
  | { body: string }
  | { reason: string }
  | { error: { body: string } };

function errorToMessage(error?: SendTransactionError) {
  const fallbackString = 'Unknown Error';
  if (!error) {
    return fallbackString;
  }
  try {
    const result =
      'message' in error
        ? error.message
        : 'body' in error
        ? capitalize(JSON.parse(error.body).error.message) || fallbackString
        : 'reason' in error && error.reason
        ? capitalize(error.reason)
        : 'error' in error
        ? capitalize(JSON.parse(error.error.body).error.message) ||
          fallbackString
        : fallbackString;
    return `Error: ${result}`;
  } catch (e) {
    return `Error: ${fallbackString}`;
  }
}

async function resolveChain(
  transaction: IncomingTransaction,
  currentChain: Chain
): Promise<PartiallyRequired<IncomingTransaction, 'chainId'>> {
  const networks = await networksStore.load();
  const chain = resolveChainForTx(transaction, currentChain, networks);
  const chainId = networks.getChainId(chain);
  return { ...transaction, chainId };
}

async function resolveGas(transaction: IncomingTransactionWithChainId) {
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
    queryKey: ['resolveGas', withChainId],
    queryFn: async () => (withChainId ? resolveGas(withChainId) : null),
    enabled: Boolean(withChainId),
    useErrorBoundary: true,
    suspense: false,
  });
  return {
    incomingTxWithChainId: withChainId,
    incomingTxWithGasAndFee: resolveGasQuery.data,
  };
}

const DEFAULT_CONFIGURATION: CustomConfiguration = {
  nonce: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
  },
};

enum View {
  default = 'default',
  advanced = 'advanced',
}

function SendTransactionContent({
  transactionStringified,
  origin,
  wallet,
  next,
}: {
  transactionStringified: string;
  origin: string;
  wallet: BareWallet;
  next: string | null;
}) {
  const [params] = useSearchParams();
  const { singleAddress } = useAddressParams();
  const incomingTransaction = useMemo(
    () => JSON.parse(transactionStringified) as IncomingTransaction,
    [transactionStringified]
  );
  const { networks } = useNetworks();
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const navigate = useNavigate();
  const showErrorBoundary = useErrorBoundary();
  const handleReject = () => {
    const windowId = params.get('windowId');
    invariant(windowId, 'windowId get-parameter is required');
    windowPort.reject(windowId);
    navigate(-1);
  };

  const { incomingTxWithChainId, incomingTxWithGasAndFee } = usePreparedTx(
    incomingTransaction,
    origin
  );

  // just for the error demo
  useEffect(() => {
    const rand = Math.random();
    if (rand > 0.75) {
      // @ts-ignore
      // eslint-disable-next-line no-console
      console.log(incomingTxWithChainId.test[100].id);
    }
  }, [incomingTxWithChainId]);

  const transaction = incomingTxWithGasAndFee || incomingTxWithChainId;

  const { data: localAddressAction, ...localAddressActionQuery } = useQuery({
    queryKey: ['incomingTxToIncomingAddressAction', transaction, networks],
    queryFn: () => {
      return transaction && networks
        ? incomingTxToIncomingAddressAction(
            { transaction, hash: '', timestamp: 0 },
            networks
          )
        : null;
    },
    keepPreviousData: true,
    enabled: Boolean(transaction) && Boolean(networks),
    useErrorBoundary: true,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: ['interpretTransaction', incomingTxWithGasAndFee, singleAddress],
    queryFn: () => {
      return incomingTxWithGasAndFee
        ? interpretTransaction(singleAddress, incomingTxWithGasAndFee)
        : null;
    },
    enabled: Boolean(incomingTxWithGasAndFee),
    suspense: false,
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const interpretAddressAction = interpretation?.action;

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const {
    mutate: signAndSendTransaction,
    context,
    ...signMutation
  } = useMutation({
    mutationFn: async (transaction: IncomingTransaction) => {
      const feeValueCommon = feeValueCommonRef.current || null;
      return await walletPort.request('signAndSendTransaction', [
        transaction,
        { initiator: origin, feeValueCommon },
      ]);
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'sendTransaction',
    onSuccess: (tx) => {
      const windowId = params.get('windowId');
      invariant(windowId, 'windowId get-parameter is required');
      windowPort.confirm(windowId, tx.hash);
      if (next) {
        navigate(next);
      }
    },
  });
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const chain =
    transaction && networks
      ? networks.getChainById(ethers.utils.hexValue(transaction.chainId))
      : null;

  const { data: chainGasPrices } = useGasPrices(chain);

  const view = params.get('view') || View.default;
  const transactionFormatted = useMemo(
    () => JSON.stringify(JSON.parse(transactionStringified), null, 2),
    [transactionStringified]
  );

  const advancedViewHref = useMemo(
    () => `?${setURLSearchParams(params, { view: View.advanced }).toString()}`,
    [params]
  );

  if (localAddressActionQuery.isSuccess && !localAddressAction) {
    throw new Error('Unexpected missing localAddressAction');
  }

  if (!networks || !chain || !localAddressAction) {
    return null;
  }

  const addressAction = interpretAddressAction || localAddressAction;

  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;
  const singleAsset = addressAction.content?.single_asset?.asset;

  return (
    <Background backgroundKind="white">
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
      <PageColumn
        // different surface color on backgroundKind="white"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        <>
          {view === View.default ? (
            <>
              <PageTop />
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
                  {addressAction.type.display_value}
                </UIText>
                <UIText kind="small/regular" color="var(--neutral-500)">
                  {originForHref ? (
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
                  actionTransfers={actionTransfers}
                  wallet={wallet}
                  singleAsset={singleAsset}
                />
                {interpretQuery.isLoading ? (
                  <InterpretLoadingState />
                ) : interpretQuery.isError ? (
                  <UIText kind="small/regular" color="var(--notice-600)">
                    Unable to analyze the details of the transaction
                  </UIText>
                ) : null}
                <Button kind="regular" as={UnstyledLink} to={advancedViewHref}>
                  Advanced View
                </Button>
              </VStack>
              <Spacer height={16} />
              {incomingTxWithGasAndFee ? (
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
              ) : null}
            </>
          ) : null}
          {view === View.advanced ? (
            <>
              <NavigationBar title="Data to Sign" />
              <PageTop />
              <Surface
                padding={16}
                style={{ border: '1px solid var(--neutral-300)' }}
              >
                <UIText
                  kind="small/regular"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                >
                  {transactionFormatted}
                </UIText>
              </Surface>
            </>
          ) : null}
        </>
        <Spacer height={16} />
      </PageColumn>
      <PageStickyFooter>
        <VStack
          style={{
            textAlign: 'center',
            paddingBottom: 24,
          }}
          gap={8}
        >
          <UIText kind="body/regular" color="var(--negative-500)">
            {signMutation.isError
              ? errorToMessage(signMutation.error as SendTransactionError)
              : null}
          </UIText>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button
              ref={focusNode}
              kind="regular"
              type="button"
              onClick={handleReject}
            >
              Cancel
            </Button>
            <Button
              disabled={signMutation.isLoading}
              onClick={() => {
                try {
                  signAndSendTransaction(
                    applyConfiguration(
                      incomingTransaction,
                      configuration,
                      chainGasPrices
                    )
                  );
                } catch (error) {
                  showErrorBoundary(error);
                }
              }}
            >
              {signMutation.isLoading ? 'Sending...' : 'Confirm'}
            </Button>
          </div>
        </VStack>
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
  invariant(origin, 'origin get-parameter is required for this view');

  const transactionStringified = params.get('transaction');
  invariant(
    transactionStringified,
    'transaction get-parameter is required for this view'
  );

  const next = params.get('next');

  return (
    <SendTransactionContent
      transactionStringified={transactionStringified}
      origin={origin}
      wallet={wallet}
      next={next}
    />
  );
}
