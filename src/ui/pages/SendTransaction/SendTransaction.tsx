import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { ethers } from 'ethers';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { NetworkIndicator } from 'src/ui/components/NetworkIndicator';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { networksStore } from 'src/modules/networks/networks-store.client';
import {
  describeTransaction,
  TransactionAction,
} from 'src/modules/ethereum/transactions/describeTransaction';
import { Twinkle } from 'src/ui/ui-kit/Twinkle';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
import { strings } from 'src/ui/transactions/strings';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { capitalize } from 'capitalize-ts';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { fetchAndAssignGasPrice } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { hasGasPrice } from 'src/modules/ethereum/transactions/gasPrices/hasGasPrice';
import { resolveChainForTx } from 'src/modules/ethereum/transactions/resolveChainForTx';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { invariant } from 'src/shared/invariant';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { PageFullBleedLine } from 'src/ui/components/PageFullBleedLine';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { focusNode } from 'src/ui/shared/focusNode';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { getError } from 'src/shared/errors/getError';
import { TransactionDescription } from './TransactionDescription';
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

async function resolveChainAndGasPrice(
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
  if (hasGasPrice(copyWithChainId)) {
    return copyWithChainId;
  } else {
    await fetchAndAssignGasPrice(copyWithChainId, networks);
    return copyWithChainId;
  }
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
};

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
  const { data: transaction } = useQuery(
    ['resolveChainAndGasPrice', incomingTransaction, origin],
    async () => {
      const currentChain = await walletPort.request('requestChainForOrigin', {
        origin,
      });
      return resolveChainAndGasPrice(
        incomingTransaction,
        createChain(currentChain)
      );
    },
    { useErrorBoundary: true }
  );

  const descriptionQuery = useQuery(
    ['description', transaction, networks],
    () =>
      transaction && networks
        ? describeTransaction(transaction, networks)
        : null,
    {
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const {
    mutate: signAndSendTransaction,
    context,
    ...signMutation
  } = useMutation(
    async (transaction: IncomingTransaction) => {
      await new Promise((r) => setTimeout(r, 1000));
      const feeValueCommon = feeValueCommonRef.current || null;
      return await walletPort.request('signAndSendTransaction', [
        transaction,
        { initiator: origin, feeValueCommon },
      ]);
    },
    {
      // onMutate creates a context that we can use in global onError handler
      // to know more about a mutation (in react-query@v4 you should use "context" instead)
      onMutate: () => 'sendTransaction',
      onSuccess: (tx) => {
        const windowId = params.get('windowId');
        invariant(windowId, 'windowId get-parameter is required');
        windowPort.confirm(windowId, tx.hash);
        if (next) {
          navigate(next);
        }
      },
    }
  );
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);
  if (!transaction || descriptionQuery.isLoading || !networks) {
    return (
      <FillView>
        <Twinkle>
          <ZerionSquircle style={{ width: 64, height: 64 }} />
        </Twinkle>
      </FillView>
    );
  }
  if (descriptionQuery.isError || !descriptionQuery.data) {
    throw descriptionQuery.error || new Error('testing');
  }

  const chain = networks.getChainById(
    ethers.utils.hexValue(transaction.chainId)
  );

  return (
    <Background backgroundKind="neutral">
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
      <PageColumn
        // different surface color on backgroundKind="neutral"
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--background)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <NetworkIndicator chain={chain} networks={networks} />
          </div>
          <PageFullBleedLine lineColor="var(--neutral-300)" />
        </div>
        <PageTop />
        <div style={{ display: 'grid', placeItems: 'center' }}>
          {origin === 'https://app.zerion.io' ? (
            <ZerionSquircle width={44} height={44} />
          ) : (
            <SiteFaviconImg size={44} url={origin} />
          )}
          <Spacer height={16} />
          <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
            {strings.actions[descriptionQuery.data.action] ||
              strings.actions[TransactionAction.contractInteraction]}
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {originForHref ? (
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
        {/*
        {incomingTransaction.chainId == null ? (
          <>
            <Spacer height={24} />
            <Surface padding={12}>
              <Media
                alignItems="start"
                image={<WarningIcon glow={true} />}
                text={
                  <UIText kind="body/regular" color="var(--notice-500)">
                    {capitalize(hostname)} did not provide chainId
                  </UIText>
                }
                detailText={
                  <UIText kind="body/regular">
                    The transaction will be sent to{' '}
                    {networks?.getNetworkById(transaction.chainId)?.name}
                  </UIText>
                }
              />
            </Surface>
          </>
        ) : null}
        */}
        <Spacer height={24} />
        <VStack gap={16}>
          <VStack gap={12}>
            <TransactionDescription
              transaction={transaction}
              transactionDescription={descriptionQuery.data}
              networks={networks}
              chain={chain}
            />
          </VStack>
          {transaction && chain ? (
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
                transaction={transaction}
                from={wallet.address}
                chain={chain}
                onFeeValueCommonReady={handleFeeValueCommonReady}
                configuration={configuration}
                onConfigurationChange={setConfiguration}
              />
            </ErrorBoundary>
          ) : null}
        </VStack>
        <Spacer height={16} />
      </PageColumn>
      <PageStickyFooter>
        <VStack
          style={{
            textAlign: 'center',
            paddingBottom: 32,
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
                    applyConfiguration(incomingTransaction, configuration)
                  );
                } catch (error) {
                  showErrorBoundary(error);
                }
              }}
            >
              {signMutation.isLoading
                ? 'Sending...'
                : descriptionQuery.data.action === TransactionAction.approve
                ? 'Approve'
                : 'Confirm'}
            </Button>
          </div>
        </VStack>
      </PageStickyFooter>
    </Background>
  );
}

export function SendTransaction() {
  const [params] = useSearchParams();
  const { data: wallet, isLoading } = useQuery(
    'wallet/uiGetCurrentWallet',
    () => walletPort.request('uiGetCurrentWallet'),
    { useErrorBoundary: true }
  );
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const transactionStringified = params.get('transaction');
  if (!transactionStringified) {
    throw new Error('transaction get-parameter is required for this view');
  }
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
