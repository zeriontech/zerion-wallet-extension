import React, { useCallback, useId, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { hashQueryKey, useMutation, useQuery } from '@tanstack/react-query';
import type { AddressPosition } from 'defi-sdk';
import { Client } from 'defi-sdk';
import {
  getChainWithMostAssetValue,
  sortPositionsByValue,
} from '@zeriontech/transactions';
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
import { Button } from 'src/ui/ui-kit/Button';
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
import { createSendAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { DisableTestnetShortcuts } from 'src/ui/features/testnet-mode/DisableTestnetShortcuts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useGasbackEstimation } from 'src/modules/ethereum/account-abstraction/rewards';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { commonToBase } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import { useEvent } from 'src/ui/shared/useEvent';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { ensureSolanaResult } from 'src/modules/shared/transactions/helpers';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
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

function useSearchParamsObj<T extends Record<string, string | undefined>>() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo(() => {
    return Object.fromEntries(searchParams) as Partial<T>;
  }, [searchParams]);
  // setSearchParams is not a stable reference: https://github.com/remix-run/react-router/issues/9304
  const setSearchParamsStable = useEvent(setSearchParams);
  const setValue = useCallback(
    (setStateAction: (value: T) => T) => {
      setSearchParamsStable(
        (current) => {
          const value = setStateAction(Object.fromEntries(current) as T);
          for (const key of current.keys()) {
            current.delete(key);
          }
          for (const key in value) {
            const newVal = value[key as keyof typeof value];
            if (newVal) {
              current.set(key, newVal);
            }
          }
          return current;
        },
        { replace: true }
      );
    },
    [setSearchParamsStable]
  );
  return [value, setValue] as const;
}

function getDefaultChain(address: string, positions: AddressPosition[]) {
  const chain = getChainWithMostAssetValue(positions ?? []);
  if (chain) {
    return chain;
  } else {
    return isSolanaAddress(address) ? NetworkId.Solana : NetworkId.Ethereum;
  }
}

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
  console.log({ isError: sendDataQuery.isError, error: sendDataQuery.error });

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

  const configuration = useMemo(() => toConfiguration(formState), [formState]);

  const snapshotRef = useRef<{ state: SendFormState } | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = { state: { ...formState } };
  };

  const sendTxMutation = useMutation({
    mutationFn: async (): Promise<SignTransactionResult> => {
      invariant(sendData?.transaction, 'Send Form parameters missing');
      invariant(currentPosition, 'Current asset position is undefined');
      const feeValueCommon = feeValueCommonRef.current || null;

      invariant(signTxBtnRef.current, 'SignTransactionButton not found');

      const chain = sendData.networkId;
      const valueInBaseUnits = commonToBase(
        tokenValue,
        getDecimals({ asset: currentPosition.asset, chain })
      ).toFixed();
      const txResponse = await signTxBtnRef.current.sendTransaction({
        transaction: sendData.transaction,
        chain: sendData.networkId.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Send',
        feeValueCommon,
        addressAction: sendData.transaction.evm
          ? createSendAddressAction({
              transaction: sendData.transaction.evm,
              asset: currentPosition.asset,
              quantity: valueInBaseUnits,
              chain,
            })
          : null,
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
              sendTxMutation.mutate();
            });
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
                standard={getAddressType(address)}
                value={tokenChain ?? ''}
                onChange={(value) => {
                  handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) => {
                  const isTestMode = Boolean(preferences?.testnetMode?.on);
                  return isTestMode === Boolean(network.is_testnet);
                }}
              />
            ) : (
              <NetworkSelect
                standard={getAddressType(address)}
                value={tokenChain ?? ''}
                onChange={(value) => {
                  handleChange('tokenChain', value);
                }}
                dialogRootNode={rootNode}
                filterPredicate={(network) => network.supports_nft_positions}
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
                value={addressInputValue ?? ''}
                required={true}
                resolvedAddress={to ?? null}
                onChange={(value) => handleChange('addressInputValue', value)}
                onResolvedChange={(value) => handleChange('to', value ?? '')}
              />
            </>
            {type === 'token' ? (
              <TokenTransferInput
                type={type}
                value={tokenValue}
                onChange={(value) => handleChange('tokenValue', value)}
                tokenAssetCode={formState.tokenAssetCode || null}
                tokenChain={formState.tokenChain || null}
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
                const partial = fromConfiguration(value);
                setUserFormState((state) => ({ ...state, ...partial }));
              }}
              gasback={gasbackEstimation}
            />
          </React.Suspense>
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
          <UIText kind="body/regular" color="var(--negative-500)">
            {sendDataQuery.isError
              ? txErrorToMessage(sendDataQuery.error)
              : null}
          </UIText>
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
