import React, { useCallback, useId, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Store } from 'store-unit';
import type { AddressPosition } from 'defi-sdk';
import { client } from 'defi-sdk';
import { useSendForm } from '@zeriontech/transactions';
import type { SendFormState } from '@zeriontech/transactions';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useAddressPositions } from 'defi-sdk';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { useSelectorStore, useStore } from '@store-unit/react';
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
import { HStack } from 'src/ui/ui-kit/HStack';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { focusNode } from 'src/ui/shared/focusNode';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { TransferVisualization } from './TransferVisualization';
import { EstimateTransactionGas } from './EstimateTransactionGas';
import { SuccessState } from './SuccessState';
import { TokenTransferInput } from './fieldsets/TokenTransferInput';

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

function StoreWatcher<T>({
  store,
  render,
}: {
  store: Store<T>;
  render: (state: T) => React.ReactNode;
}) {
  const state = useStore(store);
  return render(state);
}

const rootNode = getRootDomNode();

export function SendForm() {
  const { singleAddress: address } = useAddressParams();

  useBackgroundKind({ kind: 'white' });

  const { value: positionsValue } = useAddressPositions({
    address,
    currency: 'usd',
  });

  const positions = positionsValue?.positions;
  const sendView = useSendForm({
    currencyCode: 'usd',
    DEFAULT_CONFIGURATION,
    address,
    positions,
    getNetworks: () => networksStore.load(),
    client,
  });
  const { tokenItem, store } = sendView;
  const { type, tokenChain, nftChain } = useSelectorStore(store, [
    'type',
    'tokenChain',
    'nftChain',
  ]);

  const chain =
    type === 'token' && tokenChain
      ? createChain(tokenChain)
      : type === 'nft' && nftChain
      ? createChain(nftChain)
      : null;

  const snapshotRef = useRef<Partial<SendFormState> | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = sendView.store.getState();
  };

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const { data: gasPrices } = useGasPrices(chain);

  const {
    mutate: send,
    data: transactionHash,
    isLoading,
    reset,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      if (!gasPrices) {
        throw new Error('Unknown gas price');
      }
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
      const feeValueCommon = feeValueCommonRef.current || null;
      const txResponse = await walletPort.request('signAndSendTransaction', [
        transaction,
        { initiator: INTERNAL_ORIGIN, feeValueCommon },
      ]);
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
          // setView('default');
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
          invariant(confirmDialogRef.current, 'Dialog not found');
          showConfirmDialog(confirmDialogRef.current).then(() => {
            send();
          });
        }}
      >
        <VStack gap={16}>
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
          <div>
            {type === 'token' ? (
              <NetworkSelect
                type="connection"
                value={tokenChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
              />
            ) : (
              <NetworkSelect
                type="connection"
                value={nftChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('nftChain', value);
                }}
              />
            )}
          </div>
          <VStack gap={8}>
            <StoreWatcherByKeys
              store={store}
              keys={['to']}
              render={({ to }) => (
                <FormFieldset
                  title="Recipient"
                  startInput={
                    <UnstyledInput
                      style={{ width: '100%', textOverflow: 'ellipsis' }}
                      name="to"
                      value={to || ''}
                      placeholder="receiver address"
                      onChange={(event) => {
                        sendView.handleChange('to', event.currentTarget.value);
                      }}
                      required={true}
                    />
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
          renderWhenOpen={() => (
            <form
              method="dialog"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <UIText kind="headline/h3">Confirm Transfer</UIText>
              <Spacer height={20} />
              <StoreWatcherByKeys
                store={sendView.store}
                keys={['to', 'tokenValue']}
                render={({ to, tokenValue }) =>
                  tokenItem && to ? (
                    <TransferVisualization
                      amount={tokenValue ?? '0'}
                      tokenItem={tokenItem as unknown as AddressPosition}
                      to={to}
                    />
                  ) : null
                }
              />
              <Spacer height={20} />
              <HStack
                gap={12}
                justifyContent="center"
                style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
              >
                <Button value="cancel" kind="regular" ref={focusNode}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  value="confirm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Sign and Send
                </Button>
              </HStack>
            </form>
          )}
        ></BottomSheetDialog>
        <Button
          form={formId}
          style={{ marginTop: 'auto' }}
          kind="primary"
          disabled={isLoading}
        >
          Send
        </Button>
      </>
      <PageBottom />
    </PageColumn>
  );
}
