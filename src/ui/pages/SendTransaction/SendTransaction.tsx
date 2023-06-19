import React, { useCallback, useMemo, useRef, useState } from 'react';
import { capitalize } from 'capitalize-ts';
import { ethers } from 'ethers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { incomingTransactionToIncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
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
import { FillView } from 'src/ui/components/FillView';
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
import { getError } from 'src/shared/errors/getError';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { interpretTransaction } from 'src/modules/ethereum/transactions/interpretTransaction';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { networksStore } from 'src/modules/networks/networks-store.client';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Surface } from 'src/ui/ui-kit/Surface';
import { NavigationBar } from '../SignInWithEthereum/NavigationBar';
import { TransactionConfiguration } from './TransactionConfiguration';
import type { CustomConfiguration } from './TransactionConfiguration';
import { applyConfiguration } from './TransactionConfiguration/applyConfiguration';
import { ApplicationLine } from './Lines/ApplicationLine';
import { RecipientLine } from './Lines/RecipientLine';
import { Transfers } from './Transfers';
import { SingleAsset } from './SingleAsset';

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

async function resolveChainAndGas(
  transaction: IncomingTransaction,
  currentChain: Chain
) {
  const networks = await networksStore.load();
  const chain = resolveChainForTx(transaction, currentChain, networks);
  const chainId = networks.getChainId(chain);
  const copyWithChainId: PartiallyRequired<IncomingTransaction, 'chainId'> = {
    ...transaction,
    chainId,
  };
  return await prepareGasAndNetworkFee(copyWithChainId, networks);
}

function useErrorBoundary() {
  const [_, setState] = useState();
  return useCallback(
    (error: unknown) =>
      setState(() => {
        throw getError(error);
      }),
    []
  );
}

const DEFAULT_CONFIGURATION: CustomConfiguration = {
  nonce: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
  },
};

function TransactionViewLoading() {
  return (
    <FillView>
      <VStack gap={4} style={{ placeItems: 'center' }}>
        <CircleSpinner color="var(--primary)" size="66px" />
        <Spacer height={18} />
        <UIText kind="headline/h2">Loading</UIText>
        <UIText kind="body/regular" color="var(--neutral-500)">
          This may take a few seconds
        </UIText>
      </VStack>
    </FillView>
  );
}

/** Creates new URLSearchParams instance, new keys overwrite existing ones */
function setParams(params: URLSearchParams, values: Record<string, string>) {
  const newParams = new URLSearchParams(params);
  for (const key in values) {
    newParams.set(key, values[key]);
  }
  return newParams;
}

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

  const { data: pendingTransaction } = useQuery({
    queryKey: ['setTransactionChainIdAndGasPrice', incomingTransaction, origin],
    queryFn: async () => {
      const currentChain = await walletPort.request('requestChainForOrigin', {
        origin,
      });
      return resolveChainAndGas(incomingTransaction, createChain(currentChain));
    },
    useErrorBoundary: true,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { data: localAddressAction, isLoading: isLoadingLocalAddressAction } =
    useQuery({
      queryKey: [
        'pendingTransactionToAddressAction',
        pendingTransaction,
        networks,
      ],
      queryFn: () => {
        return pendingTransaction && networks
          ? incomingTransactionToIncomingAddressAction(
              {
                transaction: pendingTransaction,
                hash: '',
                timestamp: 0,
              },
              networks
            )
          : null;
      },
      enabled: Boolean(pendingTransaction) && Boolean(networks),
      useErrorBoundary: true,
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  const { data: interpretation, ...interpretQuery } = useQuery({
    queryKey: ['interpretTransaction', pendingTransaction, singleAddress],
    queryFn: () => {
      return pendingTransaction
        ? interpretTransaction(singleAddress, pendingTransaction)
        : null;
    },
    enabled: Boolean(pendingTransaction),
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
    pendingTransaction && networks
      ? networks.getChainById(ethers.utils.hexValue(pendingTransaction.chainId))
      : null;

  const { data: chainGasPrices } = useGasPrices(chain);

  const view = params.get('view') || View.default;
  const transactionFormatted = useMemo(
    () => JSON.stringify(JSON.parse(transactionStringified), null, 2),
    [transactionStringified]
  );

  const advancedViewHref = useMemo(
    () => `?${setParams(params, { view: View.advanced }).toString()}`,
    [params]
  );

  if (
    !networks ||
    !pendingTransaction ||
    isLoadingLocalAddressAction ||
    !chain
  ) {
    return <TransactionViewLoading />;
  }

  if (!localAddressAction) {
    throw new Error('Unexpected missing localAddressAction');
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
                {recipientAddress && addressAction.type.value === 'send' ? (
                  <RecipientLine
                    recipientAddress={recipientAddress}
                    chain={chain}
                    networks={networks}
                  />
                ) : null}
                {addressAction.label && addressAction.label.type !== 'to' ? (
                  <ApplicationLine
                    action={addressAction}
                    chain={chain}
                    networks={networks}
                  />
                ) : null}
                {actionTransfers?.outgoing?.length ||
                actionTransfers?.incoming?.length ? (
                  <Transfers
                    address={singleAddress}
                    chain={chain}
                    transfers={actionTransfers}
                  />
                ) : null}
                {singleAsset ? (
                  <SingleAsset
                    address={singleAddress}
                    actionType={addressAction.type.value}
                    asset={singleAsset}
                  />
                ) : null}
                {interpretQuery.isLoading ? (
                  <>
                    <UIText kind="small/regular" color="var(--primary)">
                      Analyzing...
                      <br />
                      <ZStack hideLowerElements={true}>
                        <DelayedRender delay={11000}>
                          <span style={{ color: 'var(--black)' }}>
                            (Going to give up soon...)
                          </span>
                        </DelayedRender>
                        <DelayedRender delay={6000}>
                          <span style={{ color: 'var(--black)' }}>
                            (Request is taking longer than usual...)
                          </span>
                        </DelayedRender>
                      </ZStack>
                    </UIText>
                  </>
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
              {pendingTransaction ? (
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
                    <TransactionConfiguration
                      transaction={pendingTransaction}
                      from={wallet.address}
                      chain={chain}
                      onFeeValueCommonReady={handleFeeValueCommonReady}
                      configuration={configuration}
                      onConfigurationChange={setConfiguration}
                    />
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
