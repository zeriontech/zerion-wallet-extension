import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Store } from 'store-unit';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useSendForm } from '@zeriontech/transactions';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
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
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { StoreWatcher } from 'src/ui/shared/StoreWatcher';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { useEvent } from 'src/ui/shared/useEvent';
import type { SendTxBtnHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useSizeStore } from 'src/ui/Onboarding/useSizeStore';
import { createSendAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { FEATURE_PAYMASTER_ENABLED } from 'src/env/config';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import { fetchAndAssignPaymaster } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { DisableTestnetShortcuts } from 'src/ui/features/testnet-mode/DisableTestnetShortcuts';
import { isDeviceAccount } from 'src/shared/types/validators';
import { useCurrency } from 'src/modules/currency/useCurrency';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { EstimateTransactionGas } from './EstimateTransactionGas';
import { SuccessState } from './SuccessState';
import type { SendFormSnapshot } from './SuccessState/SuccessState';
import { TokenTransferInput } from './fieldsets/TokenTransferInput';
import { AddressInputWrapper } from './fieldsets/AddressInput';
import { updateRecentAddresses } from './fieldsets/AddressInput/updateRecentAddresses';
import { SendTransactionConfirmation } from './SendTransactionConfirmation';
import { useAddressBackendOrEvmPositions } from './shared/useAddressBackendOrEvmPositions';
import { NftTransferInput } from './fieldsets/NftTransferInput';

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

const ENABLE_NFT_TRANSFER = true;

function SendFormComponent() {
  const { singleAddress: address, ready } = useAddressParams();
  const { currency } = useCurrency();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  const isDeviceWallet = wallet && isDeviceAccount(wallet);
  const USE_PAYMASTER_FEATURE = FEATURE_PAYMASTER_ENABLED && !isDeviceWallet;

  useBackgroundKind({ kind: 'white' });

  // Named intentionally so that this value is not used by other components of the form
  const [chainForAddressPositions, setChainForPositions] = useState<
    string | undefined
  >(undefined);

  const { data: positions } = useAddressBackendOrEvmPositions({
    address,
    currency,
    chain: chainForAddressPositions
      ? createChain(chainForAddressPositions)
      : null,
  });

  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition(
    { address, currency },
    { enabled: ready }
  );
  const addressChains = useMemo(
    () => Object.keys(portfolioDecomposition?.chains || {}),
    [portfolioDecomposition]
  );
  const { networks } = useNetworks(addressChains);

  const client = useDefiSdkClient();

  const sendView = useSendForm({
    currencyCode: currency,
    DEFAULT_CONFIGURATION,
    address,
    positions: positions || undefined,
    getNetworks: async () => {
      const networksStore = await getNetworksStore();
      return networksStore.load({ chains: addressChains });
    },
    client,
  });
  const { tokenItem, nftItem, store } = sendView;
  const { type, tokenChain, nftChain } = useSelectorStore(store, [
    'type',
    'tokenChain',
    'nftChain',
  ]);

  const { nonce: userNonce } = useSelectorStore(store.configuration, ['nonce']);

  // we sync tokenChain and nftChain in the interface + nftChain should not be presented in the URL for now
  useLayoutEffect(() => {
    store.setDefault('nftChain', tokenChain);
  }, [store, tokenChain]);

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

  const snapshotRef = useRef<SendFormSnapshot | null>(null);
  const onBeforeSubmit = () => {
    const state = sendView.store.getState();
    snapshotRef.current = { state, tokenItem, nftItem };
  };

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const { data: gasPrices } = useGasPrices(chain);
  const { preferences, setPreferences } = usePreferences();

  const configureTransactionToBeSigned = useEvent(async () => {
    const asset = tokenItem?.asset;
    async function createTransaction() {
      const { type, to, tokenChain, tokenValue, nftChain, nftAmount } =
        store.getState();
      if (type === 'token') {
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
        return result;
      } else if (type === 'nft') {
        invariant(
          nftChain && nftItem && nftAmount && to,
          'Missing sendForm/createSendNFTTransaction params'
        );
        const result = await store.createSendNFTTransaction({
          from: address,
          to,
          nftChain,
          nftAmount,
          nftItem,
        });
        result.transaction = applyConfiguration(
          result.transaction,
          sendView.store.configuration.getState(),
          gasPrices
        );
        return result;
      } else {
        throw new Error('Unexpected FormType (expected "token" | "nft")');
      }
    }
    const result = await createTransaction();
    if (result.transaction.value == null) {
      result.transaction = {
        ...result.transaction,
        value: '0x0',
      };
    }
    if (USE_PAYMASTER_FEATURE && result.transaction.nonce == null) {
      const { transaction } = result;
      const chainStr = tokenChain || nftChain;
      invariant(chainStr, 'chain value missing');
      invariant(networks, 'networks value missing');

      const { value: nonce } = await uiGetBestKnownTransactionCount({
        address: transaction.from,
        chain: createChain(chainStr),
        networks,
        defaultBlock: 'pending',
      });
      result.transaction = { ...transaction, nonce };
    }
    return result;
  });

  const signTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const chainId = chain ? networks?.getChainId(chain) : null;
  const network = chain ? networks?.getNetworkByName(chain) : null;
  const eligibilityQuery = useQuery({
    enabled: Boolean(
      USE_PAYMASTER_FEATURE &&
        network?.supports_sponsored_transactions &&
        chainId &&
        chain &&
        networks
    ),
    suspense: false,
    staleTime: 120000,
    queryKey: [
      'paymaster/check-eligibility',
      chainId,
      chain,
      networks,
      userNonce,
      address,
    ],
    queryFn: async () => {
      invariant(chainId, 'chainId not set');
      invariant(chain, 'chain not set');
      invariant(networks, 'networks not set');
      let nonce = userNonce;
      if (nonce == null) {
        const { value } = await uiGetBestKnownTransactionCount({
          address,
          chain,
          networks,
          defaultBlock: 'pending',
        });
        nonce = value;
      }
      const from = address;
      return ZerionAPI.checkPaymasterEligibility({ from, chainId, nonce });
    },
  });
  const paymasterEligible = Boolean(eligibilityQuery?.data?.data.eligible);

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
      const {
        transaction: tx,
        amount,
        asset,
      } = await configureTransactionToBeSigned();
      let transaction = tx;
      if (paymasterEligible) {
        transaction = await fetchAndAssignPaymaster(transaction);
      }
      const feeValueCommon = feeValueCommonRef.current || null;

      invariant(chain, 'Chain must be defined to sign the tx');
      invariant(signTxBtnRef.current, 'SignTransactionButton not found');

      const txResponse = await signTxBtnRef.current.sendTransaction({
        transaction,
        chain: chain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Send',
        feeValueCommon,
        addressAction: createSendAddressAction({
          transaction,
          asset,
          quantity: amount,
          chain,
        }),
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

  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const formId = useId();

  const { innerHeight } = useSizeStore();

  const navigate = useNavigate();

  if (isSuccess) {
    invariant(transactionHash, 'Missing Form State View values');
    invariant(
      snapshotRef.current,
      'State snapshot must be taken before submit'
    );
    return (
      <SuccessState
        hash={transactionHash}
        sendFormSnapshot={snapshotRef.current}
        onDone={() => {
          reset();
          snapshotRef.current = null;
          navigate('/overview/history');
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
                NFT
              </SegmentedControlRadio>
            </SegmentedControlGroup>
          ) : null}
          <div style={{ display: 'flex' }}>
            {type === 'token' ? (
              <NetworkSelect
                value={tokenChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) => {
                  if (preferences?.testnetMode?.on) {
                    return network.is_testnet || isCustomNetworkId(network.id);
                  } else {
                    return true;
                  }
                }}
              />
            ) : (
              <NetworkSelect
                value={tokenChain ?? ''}
                onChange={(value) => {
                  sendView.handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) =>
                  networks?.supports(
                    'nft_positions',
                    createChain(network.id)
                  ) || false
                }
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
              <NftTransferInput address={address} sendView={sendView} />
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
            <div style={{ position: 'relative' }}>
              <HiddenValidationInput
                form={formId}
                customValidity="Failed to load network fee. Please try adjusting transaction parameters"
              />
            </div>
          </UIText>
        )}
      >
        <EstimateTransactionGas
          key={type}
          sendFormView={sendView}
          render={({ gasQuery, transaction }) => {
            if (gasQuery.isInitialLoading) {
              return (
                <>
                  <DelayedRender delay={5000}>
                    <p>Estimating network fee...</p>
                  </DelayedRender>
                  <div style={{ position: 'relative' }}>
                    <HiddenValidationInput
                      form={formId}
                      customValidity="wait until network fee is estimated"
                    />
                  </div>
                </>
              );
            }
            if (gasQuery.isError) {
              throw new Error('Failed to estimate gas');
            }
            return transaction && chain && transaction.gas ? (
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
                      paymasterEligible={paymasterEligible}
                      onFeeValueCommonReady={handleFeeValueCommonReady}
                      configuration={configuration}
                      onConfigurationChange={(value) =>
                        sendView.store.configuration.setState(value)
                      }
                    />
                  )}
                />
              </React.Suspense>
            ) : (
              <div style={{ position: 'relative' }}>
                <HiddenValidationInput
                  form={formId}
                  customValidity="Failed to estimate gas. Please try adjusting transaction parameters"
                />
              </div>
            );
          }}
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
              <>
                <DisableTestnetShortcuts />
                <ViewLoadingSuspense>
                  <SendTransactionConfirmation
                    getTransaction={async () => {
                      const result = await configureTransactionToBeSigned();
                      return result.transaction;
                    }}
                    chain={chain}
                    sendView={sendView}
                    paymasterEligible={paymasterEligible}
                    eligibilityQuery={eligibilityQuery}
                  />
                </ViewLoadingSuspense>
              </>
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
              ref={signTxBtnRef}
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

export function SendForm() {
  const { preferences } = usePreferences();
  return (
    <SendFormComponent
      // TODO: reset nft tab when testnet mode changes?
      key={preferences?.testnetMode?.on ? 'testnet' : 'mainnet'}
    />
  );
}
