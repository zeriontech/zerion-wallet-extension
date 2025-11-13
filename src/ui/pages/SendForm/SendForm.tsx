import React, { useCallback, useId, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashQueryKey, useMutation, useQuery } from '@tanstack/react-query';
import type { AddressPosition } from 'defi-sdk';
import { Client } from 'defi-sdk';
import { sortPositionsByValue } from '@zeriontech/transactions';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { VStack } from 'src/ui/ui-kit/VStack';
import { invariant } from 'src/shared/invariant';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { createChain } from 'src/modules/networks/Chain';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworkConfig } from 'src/modules/networks/useNetworks';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import type { SendTxBtnHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import {
  createSendTokenAddressAction,
  createSendNFTAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { DisableTestnetShortcuts } from 'src/ui/features/testnet-mode/DisableTestnetShortcuts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useGasbackEstimation } from 'src/modules/ethereum/account-abstraction/rewards';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { ensureSolanaResult } from 'src/modules/shared/transactions/helpers';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { Networks } from 'src/modules/networks/Networks';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { getDefaultChain } from 'src/ui/shared/forms/trading/getDefaultChain';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import BigNumber from 'bignumber.js';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { NetworkFeeLineInfo } from '../SendTransaction/TransactionConfiguration/TransactionConfiguration';
import { SuccessState } from './SuccessState';
import { AddressInputWrapper } from './fieldsets/AddressInput';
import { updateRecentAddresses } from './fieldsets/AddressInput/updateRecentAddresses';
import { SendTransactionConfirmation } from './SendTransactionConfirmation';
import { useAddressPositionsFromBackendOrNode } from './shared/useAddressPositionsFromBackendOrNode';
import { NftTransferInput } from './fieldsets/NftTransferInput';
import { TokenTransferInput } from './fieldsets/TokenTransferInput/TokenTransferInput';
import { useCurrentPosition } from './shared/useCurrentPosition';
import { prepareSendData } from './shared/prepareSendData';
import type { SendFormState } from './shared/SendFormState';
import { fromConfiguration, toConfiguration } from './shared/helpers';

const rootNode = getRootDomNode();

const sendFormDefaultState: SendFormState = {
  type: 'token' as const,
  nftAmount: '1',
};

function prepareDefaultValues({
  address,
  positions,
}: {
  address: string;
  positions: AddressPosition[] | null;
}): SendFormState {
  return {
    ...sendFormDefaultState,
    tokenChain: getDefaultChain(address, positions ?? []),
  };
}

function SendFormComponent() {
  useBackgroundKind({ kind: 'white' });
  const { singleAddress: address } = useAddressParams();
  const { currency } = useCurrency();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  const { preferences, setPreferences } = usePreferences();
  const { innerHeight } = useWindowSizeStore();

  const [userFormState, setUserFormState] = useSearchParamsObj<SendFormState>();

  const handleChange = useCallback(
    <K extends keyof SendFormState>(key: K, value?: SendFormState[K]) =>
      setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const httpAddressPositionsQuery = useHttpAddressPositions(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    { refetchInterval: usePositionsRefetchInterval(20000) }
  );
  /** All backend-known positions across all _supported_ chains */
  const allPositions = httpAddressPositionsQuery.data?.data || null;

  const defaultFormValues = useMemo<SendFormState>(
    () => prepareDefaultValues({ address, positions: allPositions }),
    [address, allPositions]
  );

  const preState = useMemo(
    () => ({
      ...defaultFormValues,
      ...userFormState,
    }),
    [userFormState, defaultFormValues]
  );

  const { data: positionsForChain } = useAddressPositionsFromBackendOrNode({
    address,
    currency,
    chain: preState.tokenChain ? createChain(preState.tokenChain) : null,
  });

  const currentPositions = useMemo(
    () => sortPositionsByValue(positionsForChain),
    [positionsForChain]
  );

  const defaultTokenAssetCode = currentPositions.at(0)?.asset.asset_code;

  const formState: SendFormState = useMemo(
    () => ({
      tokenAssetCode: defaultTokenAssetCode,
      ...preState,
    }),
    [defaultTokenAssetCode, preState]
  );

  const {
    to = '',
    type,
    tokenChain = '',
    tokenValue = '',
    addressInputValue = '',
    data = '',
    tokenAssetCode = '',
  } = formState;
  const chain = tokenChain ? createChain(tokenChain) : null;
  const currentPosition = useCurrentPosition(formState, currentPositions);
  const confirmDialogRef = useRef<HTMLDialogElementInterface>(null);

  const signTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const formId = useId();
  const client = useDefiSdkClient();

  const { data: sendData, ...sendDataQuery } = useQuery({
    suspense: false,
    keepPreviousData: true,
    queryKey: ['prepareSendData', address, currentPosition, formState, client],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () => prepareSendData(address, currentPosition, formState, client),
    staleTime: 20000,
    retry: 1,
  });

  const paymasterEligible = Boolean(
    sendData?.paymasterEligibility?.data.eligible
  );

  const feeValueCommonRef = useRef<string | null>(
    null
  ); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);
  const gasbackValueRef = useRef<number | null>(null);
  const handleGasbackReady = useCallback((value: number) => {
    gasbackValueRef.current = value;
  }, []);

  const { data: network } = useNetworkConfig(tokenChain ?? '', {
    enabled: Boolean(tokenChain),
  });
  const { data: gasbackEstimation } = useGasbackEstimation({
    paymasterEligible: sendData?.paymasterEligibility?.data.eligible ?? null,
    suppportsSimulations: network?.supports_simulations ?? false,
    supportsSponsoredTransactions: network?.supports_sponsored_transactions,
  });

  const nativeAssetId = network?.native_asset?.id;
  const isNativeAsset = tokenAssetCode === nativeAssetId;
  const configuration = useMemo(() => toConfiguration(formState), [formState]);

  const snapshotRef = useRef<{ state: SendFormState } | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = { state: { ...formState } };
  };

  const { data: inputFungibleUsdInfoForAnalytics } = useAssetFullInfo(
    { fungibleId: currentPosition?.asset.id || '', currency: 'usd' },
    { source: useHttpClientSource() },
    { enabled: Boolean(currentPosition?.asset.id) }
  );

  const sendTxMutation = useMutation({
    mutationFn: async (
      interpretationAction: AddressAction | null
    ): Promise<SignTransactionResult> => {
      invariant(sendData?.network, 'Network must be defined to sign the tx');
      invariant(sendData?.transaction, 'Send Form parameters missing');
      invariant(currentPosition, 'Current asset position is undefined');
      const feeValueCommon = feeValueCommonRef.current || null;

      invariant(signTxBtnRef.current, 'SignTransactionButton not found');
      const fallbackAddressAction =
        type === 'token'
          ? createSendTokenAddressAction({
              address,
              hash: null,
              explorerUrl: null,
              transaction: sendData.transaction,
              network: sendData.network,
              receiverAddress: to,
              sendAsset: currentPosition.asset,
              sendAmount: {
                currency,
                quantity: tokenValue,
                value: currentPosition.asset.price?.value
                  ? new BigNumber(tokenValue)
                      .multipliedBy(currentPosition.asset.price.value)
                      .toNumber()
                  : null,
                usdValue: inputFungibleUsdInfoForAnalytics?.data?.fungible.meta
                  .price
                  ? new BigNumber(tokenValue)
                      .multipliedBy(
                        inputFungibleUsdInfoForAnalytics.data.fungible.meta
                          .price
                      )
                      .toNumber()
                  : null,
              },
            })
          : sendData.nftPosition
          ? createSendNFTAddressAction({
              address,
              hash: null,
              explorerUrl: null,
              transaction: sendData.transaction,
              network: sendData.network,
              receiverAddress: to,
              sendAsset: sendData.nftPosition,
              sendAmount: {
                currency,
                quantity: formState.nftAmount,
                usdValue: null,
                value: null,
              },
            })
          : null;

      const txResponse = await signTxBtnRef.current.sendTransaction({
        transaction: sendData.transaction,
        chain: sendData.network.id,
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Send',
        feeValueCommon,
        addressAction: interpretationAction ?? fallbackAddressAction,
      });
      if (preferences) {
        setPreferences({
          recentAddresses: updateRecentAddresses(
            to,
            preferences.recentAddresses
          ),
        });
      }
      return txResponse;
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

  const navigate = useNavigate();

  const addressType = getAddressType(address);

  const addressFilterPredicate = useCallback(
    (value: string) => {
      return isMatchForEcosystem(value, addressType);
    },
    [addressType]
  );

  if (sendTxMutation.isSuccess) {
    const result = sendTxMutation.data;
    invariant(result, 'Missing Form State View values');
    invariant(
      snapshotRef.current,
      'State snapshot must be taken before submit'
    );
    return (
      <SuccessState
        hash={result.evm?.hash ?? ensureSolanaResult(result).signature}
        address={address}
        sendFormSnapshot={snapshotRef.current}
        gasbackValue={gasbackValueRef.current}
        positions={currentPositions}
        onDone={() => {
          sendTxMutation.reset();
          snapshotRef.current = null;
          feeValueCommonRef.current = null;
          gasbackValueRef.current = null;
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
          <UnstyledLink
            to="/wallet-select"
            title="Change Wallet"
            style={{ justifySelf: 'center' }}
          >
            <WalletAvatar
              active={false}
              address={address}
              size={24}
              borderRadius={6}
            />
          </UnstyledLink>
        }
      />
      <PageTop />

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();

          if (event.currentTarget.checkValidity()) {
            invariant(confirmDialogRef.current, 'Dialog not found');
            showConfirmDialog(confirmDialogRef.current).then(
              (rawInterpretationAction) => {
                const interpretationAction =
                  rawInterpretationAction !== 'confirm'
                    ? (JSON.parse(rawInterpretationAction) as AddressAction)
                    : null;
                sendTxMutation.mutate(interpretationAction);
              }
            );
          }
        }}
      >
        <VStack gap={16}>
          <SegmentedControlGroup childrenLayout="spread-children-evenly">
            <SegmentedControlRadio
              name="type"
              value="token"
              onChange={() => handleChange('type', 'token')}
              checked={type === 'token'}
            >
              Token
            </SegmentedControlRadio>
            <SegmentedControlRadio
              name="type"
              value="nft"
              onChange={() => handleChange('type', 'nft')}
              checked={type === 'nft'}
            >
              NFT
            </SegmentedControlRadio>
          </SegmentedControlGroup>
          <div style={{ display: 'flex' }}>
            {type === 'token' ? (
              <NetworkSelect
                standard={addressType}
                showEcosystemHint={true}
                value={tokenChain ?? ''}
                onChange={(value) => {
                  handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) => {
                  const isTestMode = Boolean(preferences?.testnetMode?.on);
                  return (
                    isTestMode === Boolean(network.is_testnet) &&
                    Networks.predicate(addressType, network)
                  );
                }}
              />
            ) : (
              <NetworkSelect
                standard={addressType}
                showEcosystemHint={true}
                value={tokenChain ?? ''}
                onChange={(value) => {
                  handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) =>
                  network.supports_nft_positions &&
                  Networks.predicate(addressType, network)
                }
              />
            )}
          </div>
          <VStack gap={8}>
            <>
              <HiddenValidationInput
                customValidity={to ? '' : 'Cannot resolve recipient'}
              />
              <AddressInputWrapper
                name="addressInputValue"
                title={null}
                value={addressInputValue ?? ''}
                required={true}
                resolvedAddress={to ?? null}
                onChange={(value) => handleChange('addressInputValue', value)}
                onResolvedChange={(value) => handleChange('to', value ?? '')}
                iconSize={44}
                borderRadius={12}
                filterAddressPredicate={addressFilterPredicate}
              />
            </>
            {type === 'token' ? (
              <TokenTransferInput
                type={type}
                value={tokenValue}
                network={network}
                onChange={(value) => handleChange('tokenValue', value)}
                tokenAssetCode={tokenAssetCode || null}
                currentItem={currentPosition ?? null}
                items={currentPositions}
                onAssetCodeChange={(value) =>
                  handleChange('tokenAssetCode', value)
                }
              />
            ) : type === 'nft' ? (
              <NftTransferInput
                address={address}
                value={formState.nftAmount}
                onChange={(value) => handleChange('nftAmount', value)}
                nftId={formState.nftId || null}
                onNftIdChange={(id) => handleChange('nftId', id)}
                networkId={formState.tokenChain || null}
              />
            ) : null}
            {preferences?.configurableTransactionData &&
            isNativeAsset &&
            addressType === 'evm' ? (
              <FormFieldset
                title="Data"
                style={{ borderBottomRightRadius: 4 }}
                startInput={
                  <textarea
                    name="data"
                    value={data}
                    onChange={(event) => {
                      handleChange('data', event.currentTarget.value);
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit',
                      fontStyle: 'inherit',
                      lineHeight: 'inherit',
                      padding: 16,
                      paddingTop: 0,
                      width: 'calc(100% + 32px)',
                      marginLeft: -16,
                      marginBottom: -16,
                      resize: 'vertical',
                    }}
                    rows={2}
                    placeholder="0x..."
                  />
                }
              />
            ) : null}
          </VStack>
        </VStack>
      </form>
      <Spacer height={16} />
      <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
        <HiddenValidationInput
          form={formId}
          customValidity={
            sendData?.transaction == null || sendDataQuery.isPreviousData
              ? 'Form is not ready. Please check your network, gas token amount and input values'
              : ''
          }
        />
      </div>
      <ErrorBoundary
        renderError={(error) => (
          <UIText kind="body/regular" title={error?.message}>
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
        {chain && sendData?.transaction?.evm ? (
          <React.Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <CircleSpinner />
              </div>
            }
          >
            <TransactionConfiguration
              keepPreviousData={true}
              transaction={sendData.transaction.evm}
              from={address}
              chain={chain}
              paymasterEligible={paymasterEligible}
              paymasterPossible={sendData.paymasterPossible}
              paymasterWaiting={false}
              onFeeValueCommonReady={handleFeeValueCommonReady}
              configuration={configuration}
              onConfigurationChange={(value) => {
                const { slippage: _, ...partial } = fromConfiguration(value);
                setUserFormState((state) => ({ ...state, ...partial }));
              }}
              gasback={gasbackEstimation}
            />
          </React.Suspense>
        ) : addressType === 'solana' ? (
          <div style={{ display: 'grid' }}>
            {sendData?.transaction?.solana && sendData.networkFee ? (
              <NetworkFeeLineInfo
                networkFee={sendData.networkFee}
                isLoading={
                  sendDataQuery.isFetching || sendDataQuery.isPreviousData
                }
              />
            ) : sendDataQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <CircleSpinner />
              </div>
            ) : null}
          </div>
        ) : null}
      </ErrorBoundary>
      <>
        <BottomSheetDialog
          ref={confirmDialogRef}
          height={innerHeight >= 750 ? '70vh' : '90vh'}
          containerStyle={{ display: 'flex', flexDirection: 'column' }}
          renderWhenOpen={() => {
            invariant(sendData?.transaction, 'Transaction must be configured');
            return (
              <>
                <DisableTestnetShortcuts />
                <ViewLoadingSuspense>
                  <SendTransactionConfirmation
                    transaction={sendData.transaction}
                    formState={formState}
                    paymasterEligible={paymasterEligible}
                    paymasterPossible={sendData.paymasterPossible}
                    onGasbackReady={handleGasbackReady}
                  />
                </ViewLoadingSuspense>
              </>
            );
          }}
        ></BottomSheetDialog>
        <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
          {sendDataQuery.isError ? (
            <ErrorMessage error={getError(sendDataQuery.error)} />
          ) : null}
          {sendTxMutation.isError ? (
            <ErrorMessage error={getError(sendTxMutation.error)} />
          ) : null}
          {wallet ? (
            <SignTransactionButton
              ref={signTxBtnRef}
              form={formId}
              wallet={wallet}
              disabled={sendTxMutation.isLoading}
              holdToSign={false}
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
