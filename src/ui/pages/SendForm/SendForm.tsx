import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Store } from 'store-unit';
import { client } from 'defi-sdk';
import { useSendForm } from '@zeriontech/transactions';
import type { SendFormState } from '@zeriontech/transactions';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { useSelectorStore } from '@store-unit/react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { invariant } from 'src/shared/invariant';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { createChain } from 'src/modules/networks/Chain';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { StoreWatcher } from 'src/ui/shared/StoreWatcher';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { useEvent } from 'src/ui/shared/useEvent';
import type { SignerSenderHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useSizeStore } from 'src/ui/Onboarding/useSizeStore';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { EstimateTransactionGas } from './EstimateTransactionGas';
import { SuccessState } from './SuccessState';
import { TokenTransferInput } from './fieldsets/TokenTransferInput';
import { AddressInputWrapper } from './fieldsets/AddressInput';
import { updateRecentAddresses } from './fieldsets/AddressInput/updateRecentAddresses';
import { SendTransactionConfirmation } from './SendTransactionConfirmation';
import { useAddressBackendOrEvmPositions } from './shared/useAddressBackendOrEvmPositions';

function StoreWatcherByKeys<T extends Record<string, unknown>>({
  store,
  keys,
  render,
}: {
  store: Store<T>;
  keys: string[];
  render: (state: T) => React.ReactNode;
}) {
  const state = useSelectorStore(store, keys);
  return render(state);
}

const rootNode = getRootDomNode();

const ENABLE_NFT_TRANSFER = false;

export function SendForm() {
  const { singleAddress: address } = useAddressParams();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  useBackgroundKind({ kind: 'white' });

  // Named intentionally so that this value is not used by other components of the form
  const [chainForAddressPositions, setChainForPositions] = useState<
    string | undefined
  >(undefined);

  const { data: positions } = useAddressBackendOrEvmPositions({
    address,
    currency: 'usd',
    chain: chainForAddressPositions
      ? createChain(chainForAddressPositions)
      : null,
  });

  const sendView = useSendForm({
    currencyCode: 'usd',
    DEFAULT_CONFIGURATION,
    address,
    positions: positions || undefined,
    getNetworks: () => networksStore.load(),
    client,
  });
  const { tokenItem, store } = sendView;
  const { type, tokenChain, nftChain } = useSelectorStore(store, [
    'type',
    'tokenChain',
    'nftChain',
  ]);

  useEffect(() => {
    store.on('change', () => {
      // The easiest way support custom networks is to track the tokenChain value change
      // and pass positions based on it to `useSendForm` hook. The way the hook is agnostic about custom chain.
      // Other solutions are possible:
      // 1. Querying all custom networks for balance and mixing the results into backend addressPositions
      // 2. Updating useSendForm hook to introduce a notion of "special" chains that need to query for positions separately
      setChainForPositions(store.getState().tokenChain);
    });
  }, [store]);

  const chain =
    type === 'token' && tokenChain
      ? createChain(tokenChain)
      : type === 'nft' && nftChain
      ? createChain(nftChain)
      : null;

  const snapshotRef = useRef<SendFormState | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = sendView.store.getState();
  };

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const { data: gasPrices } = useGasPrices(chain);
  const { preferences, setPreferences } = usePreferences();

  const configureTransactionToBeSigned = useEvent(async () => {
    const asset = tokenItem?.asset;
    const { to, tokenChain, tokenValue } = store.getState();
    invariant(
      address && to && asset && tokenChain && tokenValue,
      'Send Form parameters missing'
    );
    const result = await sendView.store.createSendTransaction({
      from: address,
      to,
      asset,
      tokenChain,
      tokenValue,
    });
    result.transaction = applyConfiguration(
      result.transaction,
      sendView.store.configuration.getState(),
      gasPrices
    );
    const { transaction } = result;
    return transaction;
  });

  const signerSenderRef = useRef<SignerSenderHandle | null>(null);

  const {
    mutate: sendTransaction,
    data: transactionHash,
    isLoading,
    reset,
    isSuccess,
    ...sendTxMutation
  } = useMutation({
    mutationFn: async () => {
      const { to } = store.getState();
      invariant(to, 'Send Form parameters missing');
      const transaction = await configureTransactionToBeSigned();
      const feeValueCommon = feeValueCommonRef.current || null;

      invariant(chain, 'Chain must be defined to sign the tx');
      invariant(signerSenderRef.current, 'SignTransactionButton not found');

      const txResponse = await signerSenderRef.current.sendTransaction({
        transaction,
        chain,
        initiator: INTERNAL_ORIGIN,
        feeValueCommon,
      });
      if (preferences) {
        setPreferences({
          recentAddresses: updateRecentAddresses(
            to,
            preferences.recentAddresses
          ),
        });
      }
      return txResponse.hash;
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    // onMutate: () => 'sendTransaction',
    onMutate: () => {
      onBeforeSubmit();
      return 'sendTransaction';
    },
  });

  const { networks } = useNetworks();

  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const formId = useId();

  const { innerHeight } = useSizeStore();

  if (!networks || !positions) {
    return <ViewLoading kind="network" />;
  }

  if (isSuccess) {
    invariant(tokenItem && transactionHash, 'Missing Form State View values');
    invariant(
      snapshotRef.current,
      'State snapshot must be taken before submit'
    );
    return (
      <SuccessState
        hash={transactionHash}
        tokenItem={tokenItem}
        sendFormState={snapshotRef.current}
        onDone={() => {
          reset();
          snapshotRef.current = null;
        }}
      />
    );
  }

  return (
    <PageColumn>
      <NavigationTitle
        title="Send"
        elementEnd={
          <Button
            as={UnstyledLink}
            to="/wallet-select"
            kind="ghost"
            title="Change Wallet"
          >
            <WalletAvatar
              active={false}
              address={address}
              size={32}
              borderRadius={4}
            />
          </Button>
        }
      />
      <PageTop />

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();

          if (event.currentTarget.checkValidity()) {
            invariant(confirmDialogRef.current, 'Dialog not found');
            showConfirmDialog(confirmDialogRef.current).then(() => {
              sendTransaction();
            });
          }
        }}
      >
        <VStack gap={16}>
          {ENABLE_NFT_TRANSFER ? (
            <SegmentedControlGroup childrenLayout="spread-children-evenly">
              <SegmentedControlRadio
                name="type"
                value="token"
                onChange={() => sendView.handleChange('type', 'token')}
                checked={type === 'token'}
              >
                Token
              </SegmentedControlRadio>
              <SegmentedControlRadio
                name="type"
                value="nft"
                onChange={() => sendView.handleChange('type', 'nft')}
                checked={type === 'nft'}
              >
                NFTs
              </SegmentedControlRadio>
            </SegmentedControlGroup>
          ) : null}
          <div>
            {type === 'token' ? (
              <NetworkSelect
                value={tokenChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
              />
            ) : (
              <NetworkSelect
                value={nftChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('nftChain', value);
                }}
                dialogRootNode={rootNode}
              />
            )}
          </div>
          <VStack gap={8}>
            <StoreWatcherByKeys
              store={store}
              keys={['to', 'addressInputValue']}
              render={({ to, addressInputValue }) => (
                <AddressInputWrapper
                  name="addressInputValue"
                  value={addressInputValue ?? ''}
                  required={true}
                  resolvedAddress={to ?? null}
                  onChange={(value) =>
                    sendView.handleChange('addressInputValue', value)
                  }
                  onResolvedChange={(value) =>
                    sendView.handleChange('to', value)
                  }
                />
              )}
            />
            {type === 'token' ? (
              <TokenTransferInput sendView={sendView} />
            ) : type === 'nft' ? (
              <span>NFT select input</span>
            ) : null}
          </VStack>
        </VStack>
      </form>
      <Spacer height={16} />
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
        <EstimateTransactionGas
          sendFormView={sendView}
          render={({ gasQuery: _gasQuery, transaction }) =>
            transaction && chain && transaction.gas ? (
              <React.Suspense
                fallback={
                  <div style={{ display: 'flex', justifyContent: 'end' }}>
                    <CircleSpinner />
                  </div>
                }
              >
                <StoreWatcher
                  store={sendView.store.configuration}
                  render={(configuration) => (
                    <TransactionConfiguration
                      keepPreviousData={true}
                      transaction={transaction}
                      from={address}
                      chain={chain}
                      onFeeValueCommonReady={handleFeeValueCommonReady}
                      configuration={configuration}
                      onConfigurationChange={(value) =>
                        sendView.store.configuration.setState(value)
                      }
                    />
                  )}
                />
              </React.Suspense>
            ) : null
          }
        />
      </ErrorBoundary>
      <>
        <BottomSheetDialog
          ref={confirmDialogRef}
          height={innerHeight >= 750 ? '70vh' : '90vh'}
          containerStyle={{ display: 'flex', flexDirection: 'column' }}
          renderWhenOpen={() => {
            invariant(chain, 'Chain must be defined');
            return (
              <ViewLoadingSuspense>
                <SendTransactionConfirmation
                  getTransaction={configureTransactionToBeSigned}
                  chain={chain}
                  sendView={sendView}
                />
              </ViewLoadingSuspense>
            );
          }}
        ></BottomSheetDialog>
        <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
          <UIText kind="body/regular" color="var(--negative-500)">
            {sendTxMutation.isError
              ? txErrorToMessage(sendTxMutation.error)
              : null}
          </UIText>
          {wallet ? (
            <SignTransactionButton
              ref={signerSenderRef}
              form={formId}
              wallet={wallet}
              disabled={isLoading}
            />
          ) : null}
        </VStack>
      </>
      <PageBottom />
    </PageColumn>
  );
}
