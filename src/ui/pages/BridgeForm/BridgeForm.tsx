import { useMutation, useQuery } from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import {
  NetworkId,
  getChainWithMostAssetValue,
} from '@zeriontech/transactions';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { useQuotes } from 'src/ui/shared/requests/useQuotes';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { baseToCommon, commonToBase } from 'src/shared/units/convert';
import { getAddress, getDecimals } from 'src/modules/networks/asset';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { AddressPosition } from 'defi-sdk';
import { client, useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import {
  SignTransactionButton,
  type SendTxBtnHandle,
} from 'src/ui/components/SignTransactionButton';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import { useEvent } from 'src/ui/shared/useEvent';
import { invariant } from 'src/shared/invariant';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  createApproveAddressAction,
  createSendAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { useTransactionStatus } from 'src/ui/transactions/useLocalTransactionStatus';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { TransactionConfirmationView } from 'src/ui/components/address-action/TransactionConfirmationView';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import BigNumber from 'bignumber.js';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { AllowanceForm } from 'src/ui/components/AllowanceForm';
import { UNLIMITED_APPROVAL_AMOUNT } from 'src/modules/ethereum/constants';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { AnimatedAppear } from 'src/ui/components/AnimatedAppear';
import { isNumeric } from 'src/shared/isNumeric';
import { PageBottom } from 'src/ui/components/PageBottom';
import { getNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import { NetworkSelect } from '../Networks/NetworkSelect';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { useApproveHandler } from '../SwapForm/shared/useApproveHandler';
import { RateLine } from '../SwapForm/Quotes';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { ProtocolFeeLine } from '../SwapForm/shared/ProtocolFeeLine';
import { ApproveHintLine } from '../SwapForm/ApproveHintLine';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { getQuotesErrorMessage } from '../SwapForm/Quotes/getQuotesErrorMessage';
import type { BridgeFormState } from './shared/types';
import { useBridgeTokens } from './useBridgeTokens';
import { getAvailablePositions } from './getAvailablePositions';
import { ReverseButton } from './ReverseButton';
import { SpendTokenField } from './fieldsets/SpendTokenField';
import { ReceiveTokenField } from './fieldsets/ReceiveTokenField';
import { SuccessState } from './SuccessState';

const rootNode = getRootDomNode();

function FormHint({
  spendInput,
  spendPosition,
  quotesData,
  render,
}: {
  spendInput?: string;
  spendPosition: AddressPosition | null;
  quotesData: QuotesData;
  render: (message: string | null) => React.ReactNode;
}) {
  const value = spendInput;
  const invalidValue = value && !isNumeric(value);
  const valueMissing = !value || Number(value) === 0;

  const positionBalanceCommon = spendPosition
    ? getPositionBalance(spendPosition)
    : null;
  const exceedsBalance = Number(spendInput) > Number(positionBalanceCommon);

  let message: string | null = null;
  if (exceedsBalance) {
    message = 'Insufficient balance';
  } else if (valueMissing) {
    message = 'Enter amount';
  } else if (invalidValue) {
    message = 'Incorrect amount';
  } else if (quotesData.error) {
    message = getQuotesErrorMessage(quotesData);
  }
  return render(message);
}

function BridgeFormComponent() {
  useBackgroundKind({ kind: 'white' });

  const { singleAddress: address, ready } = useAddressParams();
  const { currency } = useCurrency();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { data: positionsResponse } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    { refetchInterval: usePositionsRefetchInterval(20000) }
  );
  const positions = positionsResponse?.data ?? null;

  const { data: portfolioResponse } = useWalletPortfolio(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    { enabled: ready }
  );
  const portfolioDecomposition = portfolioResponse?.data;
  const addressChains = useMemo(
    () => Object.keys(portfolioDecomposition?.chains || {}),
    [portfolioDecomposition]
  );

  const { networks } = useNetworks(addressChains);

  const defaultSpendNetworkId = useMemo(
    () =>
      positions
        ? getChainWithMostAssetValue(positions) ?? NetworkId.Ethereum
        : NetworkId.Ethereum,
    [positions]
  );
  const defaultReceiveNetworkId =
    defaultSpendNetworkId === NetworkId.Zero
      ? NetworkId.Ethereum
      : NetworkId.Zero;

  const defaultSpendChain = createChain(defaultSpendNetworkId);
  const defaultReceiveChain = createChain(defaultReceiveNetworkId);

  const { data: spendTokens } = useBridgeTokens({
    inputChain: defaultSpendChain,
    outputChain: defaultReceiveChain,
    direction: 'input',
    enabled: true,
  });

  const { data: receiveTokens } = useBridgeTokens({
    inputChain: defaultSpendChain,
    outputChain: defaultReceiveChain,
    direction: 'output',
    enabled: true,
  });

  const availableSpendPositions = useMemo(
    () =>
      getAvailablePositions({
        positions,
        supportedTokens: spendTokens,
        chain: defaultSpendChain,
      }),
    [positions, defaultSpendChain, spendTokens]
  );

  const availableReceivePositions = useMemo(
    () =>
      getAvailablePositions({
        positions,
        supportedTokens: receiveTokens,
        chain: defaultReceiveChain,
      }),
    [positions, defaultReceiveChain, receiveTokens]
  );

  const { data: spendChainNativeAsset } = useQuery({
    queryKey: ['getNativeAsset', defaultSpendChain, currency],
    queryFn: () => getNativeAsset({ chain: defaultSpendChain, currency }),
    staleTime: Infinity,
    suspense: true,
  });
  const { data: receiveChainNativeAsset } = useQuery({
    queryKey: ['getNativeAsset', defaultReceiveChain, currency],
    queryFn: () => getNativeAsset({ chain: defaultReceiveChain, currency }),
    staleTime: Infinity,
    suspense: true,
  });

  const defaultSpendToken =
    availableSpendPositions?.sorted[0].asset.asset_code ??
    spendChainNativeAsset?.asset_code;

  const defaultReceiveToken =
    availableReceivePositions?.sorted[0].asset.asset_code ??
    receiveChainNativeAsset?.asset_code;

  const [defaultFormState, setDefaultFormState] = useState<BridgeFormState>({
    spendChainInput: defaultSpendChain.toString(),
    receiveChainInput: defaultReceiveChain.toString(),
    spendTokenInput: defaultSpendToken,
    receiveTokenInput: defaultReceiveToken,
  });

  const [userFormState, setUserFormState] = useState<BridgeFormState>({
    receiverAddressInput: null,
    showReceiverAddressInput: false,
  });

  const formState = { ...defaultFormState, ...userFormState };

  const {
    spendChainInput,
    receiveChainInput,
    spendInput,
    receiveInput,
    spendTokenInput,
    receiveTokenInput,
    receiverAddressInput,
    showReceiverAddressInput,
  } = formState;

  const spendChain = spendChainInput ? createChain(spendChainInput) : null;
  const receiveChain = receiveChainInput
    ? createChain(receiveChainInput)
    : null;

  const spendAssetQuery = useAssetsPrices(
    { asset_codes: [spendTokenInput].filter(isTruthy), currency },
    { keepStaleData: true, client, enabled: Boolean(spendTokenInput) }
  );
  const receiveAssetQuery = useAssetsPrices(
    { asset_codes: [receiveTokenInput].filter(isTruthy), currency },
    { keepStaleData: true, client, enabled: Boolean(receiveTokenInput) }
  );

  const spendAsset = spendTokenInput
    ? spendAssetQuery.value?.[spendTokenInput] ?? null
    : null;
  const receiveAsset = receiveTokenInput
    ? receiveAssetQuery.value?.[receiveTokenInput] ?? null
    : null;

  const spendPosition =
    spendTokenInput && availableSpendPositions
      ? availableSpendPositions.map[spendTokenInput]
      : null;
  const receivePosition =
    receiveTokenInput && availableReceivePositions
      ? availableReceivePositions.map[receiveTokenInput]
      : null;

  const quotesData = useQuotes({
    address,
    slippage: null,
    primaryInput: 'spend',
    spendChainInput,
    receiveChainInput,
    spendInput,
    receiveInput,
    spendTokenInput,
    receiveTokenInput,
    spendPosition,
    receivePosition,
  });

  // TODO: useEffect to update defaultSpendToken, defaultReceiveToken on chain change

  const {
    transaction: bridgeTransaction,
    quote,
    refetch: refetchQuotes,
  } = quotesData;

  const reverseChains = useCallback(
    () =>
      setUserFormState((state) => ({
        ...state,
        spendChainInput: receiveChainInput,
        receiveChainInput: spendChainInput,
      })),
    [setUserFormState, receiveChainInput, spendChainInput]
  );

  const reverseTokens = useCallback(
    () =>
      setUserFormState((state) => ({
        ...state,
        spendTokenInput: receiveTokenInput,
        receiveTokenInput: spendTokenInput,
      })),
    [setUserFormState, spendTokenInput, receiveTokenInput]
  );

  const handleChange = <K extends keyof BridgeFormState>(
    key: K,
    value?: BridgeFormState[K]
  ) => setUserFormState((state) => ({ ...state, [key]: value }));

  const handleTokenChange = useCallback(
    (name: 'spendTokenInput' | 'receiveTokenInput', value: string) => {
      const isSameAsOpposite =
        (name === 'spendTokenInput' && value === receiveTokenInput) ||
        (name === 'receiveTokenInput' && value === spendTokenInput);

      if (isSameAsOpposite) {
        reverseTokens();
      } else {
        handleChange(name, value);
      }
    },
    [receiveTokenInput, reverseTokens, spendTokenInput]
  );

  useEffect(() => {
    if (!quote) {
      const opposite = 'receiveInput';
      handleChange(opposite, '');
    } else if (spendChain && receivePosition) {
      const value = quote.output_amount_estimation || 0;
      const decimals = getDecimals({
        asset: receivePosition.asset,
        chain: spendChain,
      });
      handleChange('receiveInput', baseToCommon(value, decimals).toFixed());
    }
  }, [quote, receivePosition, spendChain]);

  const snapshotRef = useRef<BridgeFormState | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = formState;
  };

  const feeValueCommonRef = useRef<string | null>(
    null
  ); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const { data: gasPrices } = useGasPrices(spendChain);

  const spendAmountBase = useMemo(
    () =>
      spendInput && spendPosition && spendChain
        ? commonToBase(
            spendInput,
            getDecimals({ asset: spendPosition.asset, chain: spendChain })
          ).toFixed()
        : null,
    [spendChain, spendInput, spendPosition]
  );

  const [allowanceQuantityBase, setAllowanceQuantityBase] =
    useState(spendAmountBase);

  useEffect(() => setAllowanceQuantityBase(spendAmountBase), [spendAmountBase]);

  const spendTokenContractAddress =
    spendPosition && spendChain
      ? getAddress({ asset: spendPosition.asset, chain: spendChain }) ?? null
      : null;

  const {
    enough_allowance,
    allowanceQuery: { refetch: refetchAllowanceQuery },
    approvalTransactionQuery: { isFetching: approvalTransactionIsFetching },
    approvalTransaction,
  } = useApproveHandler({
    address,
    chain: spendChain,
    spendAmountBase,
    allowanceQuantityBase,
    spender: quote?.token_spender ?? null,
    contractAddress: spendTokenContractAddress,
    enabled: quotesData.done && Boolean(quote && !quote.enough_allowance),
    keepPreviousData: false,
  });

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);
  const approveTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const { data: networkNonce, refetch: refetchNonce } = useQuery({
    suspense: false,
    queryKey: ['uiGetBestKnownTransactionCount', address, spendChain, networks],
    queryFn: async () => {
      if (!spendChain || !networks) {
        return null;
      }
      const result = await uiGetBestKnownTransactionCount({
        address,
        chain: spendChain,
        networks,
        defaultBlock: 'pending',
      });
      return result.value;
    },
  });

  const [txConfiguration, setTxConfiguration] = useState(DEFAULT_CONFIGURATION);

  const userNonce = txConfiguration.nonce;
  const nonce = userNonce ?? networkNonce ?? undefined;

  const configureTransactionToBeSigned = useEvent(
    (tx: IncomingTransactionWithChainId) => {
      invariant(spendChain && networks, 'Not ready to prepare the transaction');
      let txToSign = applyConfiguration(tx, txConfiguration, gasPrices);
      if (txToSign.nonce == null) {
        txToSign = {
          ...txToSign,
          nonce: nonce != null ? Number(nonce) : undefined,
        };
      }
      return { ...txToSign, from: address };
    }
  );

  const {
    mutate: sendApproveTransaction,
    data: approveHash,
    reset: resetApproveMutation,
    ...approveMutation
  } = useMutation({
    mutationFn: async () => {
      invariant(approvalTransaction, 'approve transaction is not configured');
      const transaction = configureTransactionToBeSigned(approvalTransaction);
      const feeValueCommon = feeValueCommonRef.current || null;

      invariant(spendChain, 'Spend chain must be defined to sign the tx');
      invariant(approveTxBtnRef.current, 'SignTransactionButton not found');
      invariant(spendPosition, 'Spend position must be defined');
      invariant(quote, 'Cannot submit transaction without a quote');

      const txResponse = await approveTxBtnRef.current.sendTransaction({
        transaction,
        chain: spendChain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Bridge',
        feeValueCommon,
        addressAction: createApproveAddressAction({
          transaction: { ...transaction, from: address },
          asset: spendPosition.asset,
          quantity: quote.input_amount_estimation,
          chain: spendChain,
        }),
      });
      return txResponse.hash;
    },
    onMutate: () => 'sendTransaction',
  });

  const approveTxStatus = useTransactionStatus(approveHash ?? null);
  useEffect(() => {
    if (approveTxStatus === 'confirmed') {
      refetchAllowanceQuery();
      refetchQuotes();
      refetchNonce();
    } else if (approveTxStatus === 'failed' || approveTxStatus === 'dropped') {
      resetApproveMutation();
    }
  }, [
    approveTxStatus,
    refetchAllowanceQuery,
    refetchNonce,
    refetchQuotes,
    resetApproveMutation,
  ]);

  const {
    mutate: sendTransaction,
    data: transactionHash,
    isLoading,
    reset,
    isSuccess,
    ...sendTransactionMutation
  } = useMutation({
    mutationFn: async () => {
      if (!gasPrices) {
        throw new Error('Unknown gas price');
      }
      invariant(quote, 'Cannot submit transaction without a quote');
      invariant(bridgeTransaction, 'No transaction in quote');
      const transaction = configureTransactionToBeSigned(bridgeTransaction);
      const feeValueCommon = feeValueCommonRef.current || null;
      invariant(spendChain, 'Spend chain must be defined to sign the tx');
      invariant(
        spendPosition && receivePosition,
        'Bridge positions must be defined'
      );
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      const txResponse = await sendTxBtnRef.current.sendTransaction({
        transaction,
        chain: spendChain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Bridge',
        feeValueCommon,
        addressAction: createSendAddressAction({
          transaction,
          asset: spendPosition.asset,
          quantity: quote.input_amount_estimation,
          chain: spendChain,
        }),
        quote,
      });
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

  const resetMutationIfNotLoading = useEvent(() => {
    if (!isLoading) {
      reset();
    }
  });

  useEffect(() => {
    resetMutationIfNotLoading();
    resetApproveMutation();
  }, [
    resetApproveMutation,
    resetMutationIfNotLoading,
    spendChain,
    spendInput,
    spendTokenInput,
    receiveTokenInput,
  ]);

  const formId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);

  const allowanceDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { innerHeight } = useWindowSizeStore();

  const navigate = useNavigate();

  const positionDistribution =
    portfolioDecomposition?.positionsChainsDistribution ?? {};
  const networkSupportsBridging = (network: NetworkConfig) =>
    networks?.supports('bridging', createChain(network.id)) || false;

  if (isSuccess) {
    invariant(
      spendPosition && receivePosition && transactionHash,
      'Missing Form State View values'
    );
    invariant(
      snapshotRef.current,
      'State snapshot must be taken before submit'
    );
    return (
      <SuccessState
        hash={transactionHash}
        spendPosition={spendPosition}
        receivePosition={receivePosition}
        formState={snapshotRef.current}
        onDone={() => {
          reset();
          snapshotRef.current = null;
          feeValueCommonRef.current = null;
          navigate('/overview/history');
        }}
      />
    );
  }

  const isApproveMode =
    approveMutation.isLoading ||
    (quotesData.done && !enough_allowance) ||
    approveTxStatus === 'pending';

  const showApproveHintLine =
    (quotesData.done && !enough_allowance) || !approveMutation.isIdle;

  const currentTransaction = isApproveMode
    ? approvalTransaction
    : bridgeTransaction;

  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle
        title="Bridge"
        elementEnd={
          <UnstyledLink
            // place element at the edge of PageColumn
            style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
            to="/wallet-select"
            title="Change Wallet"
          >
            <WalletAvatar
              active={false}
              address={address}
              size={24}
              borderRadius={4}
            />
          </UnstyledLink>
        }
      />

      <BottomSheetDialog
        ref={confirmDialogRef}
        key={currentTransaction === approvalTransaction ? 'approve' : 'swap'}
        height="min-content"
        displayGrid={true}
        style={{ minHeight: innerHeight >= 750 ? '70vh' : '90vh' }}
        containerStyle={{ display: 'flex', flexDirection: 'column' }}
        renderWhenOpen={() => {
          invariant(
            currentTransaction,
            'Transaction must be defined to confirm'
          );
          invariant(wallet, 'Current wallet not found');
          invariant(spendChain, 'Spend chain must be defined');
          return (
            <ViewLoadingSuspense>
              <TransactionConfirmationView
                title={
                  currentTransaction === approvalTransaction
                    ? 'Approve'
                    : 'Bridge'
                }
                wallet={wallet}
                showApplicationLine={true}
                chain={spendChain}
                transaction={configureTransactionToBeSigned(currentTransaction)}
                configuration={txConfiguration}
                localAllowanceQuantityBase={allowanceQuantityBase || undefined}
                onOpenAllowanceForm={() =>
                  allowanceDialogRef.current?.showModal()
                }
                paymasterEligible={false}
                paymasterPossible={false}
                eligibilityQuery={{
                  data: { data: { eligible: false } },
                  status: 'success',
                  isError: false,
                }}
                onGasbackReady={null}
              />
            </ViewLoadingSuspense>
          );
        }}
      />

      <BottomSheetDialog
        ref={allowanceDialogRef}
        height="min-content"
        renderWhenOpen={() => {
          invariant(spendChain, 'Spend chain must be defined');
          invariant(
            spendPosition?.asset,
            'Spend position asset must be defined'
          );
          invariant(
            spendPosition?.quantity,
            'Spend position quantity must be defined'
          );
          invariant(
            allowanceQuantityBase,
            'Allowance quantity must be defined'
          );
          const value = new BigNumber(allowanceQuantityBase);
          const positionBalanceCommon = getPositionBalance(spendPosition);
          return (
            <ViewLoadingSuspense>
              <>
                <DialogTitle
                  alignTitle="start"
                  title={<UIText kind="headline/h3">Edit allowance</UIText>}
                />
                <Spacer height={24} />
                <div
                  style={{
                    ['--surface-background-color' as string]:
                      'var(--z-index-1-inverted)',
                    display: 'grid',
                    gap: 12,
                    gridTemplateRows: 'auto 1fr',
                    flexGrow: 1,
                  }}
                >
                  <AllowanceForm
                    asset={spendPosition.asset}
                    chain={spendChain}
                    address={address}
                    balance={positionBalanceCommon}
                    requestedAllowanceQuantityBase={UNLIMITED_APPROVAL_AMOUNT}
                    value={value}
                    onSubmit={(quantity) => {
                      setAllowanceQuantityBase(quantity);
                      allowanceDialogRef.current?.close();
                    }}
                  />
                </div>
              </>
            </ViewLoadingSuspense>
          );
        }}
      />

      <form
        id={formId}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();

          if (event.currentTarget.checkValidity()) {
            invariant(confirmDialogRef.current, 'Dialog not found');
            const formData = new FormData(event.currentTarget);
            const submitType = formData.get('submit_type');
            showConfirmDialog(confirmDialogRef.current).then(() => {
              if (submitType === 'approve') {
                sendApproveTransaction();
              } else if (submitType === 'bridge') {
                sendTransaction();
              } else {
                throw new Error('Must set a submit_type to form');
              }
            });
          }
        }}
      >
        <VStack gap={16}>
          <HStack
            gap={8}
            alignItems="center"
            style={{ gridTemplateColumns: '1fr 32px 1fr' }}
          >
            <NetworkSelect
              value={spendChainInput ?? ''}
              onChange={(value) =>
                setUserFormState((state) => ({
                  ...state,
                  spendChainInput: value,
                }))
              }
              dialogRootNode={rootNode}
              filterPredicate={(network) =>
                networkSupportsBridging(network) &&
                (network.id === NetworkId.Ethereum ||
                  network.id in positionDistribution)
              }
            />
            <ReverseButton onClick={reverseChains} />
            <NetworkSelect
              value={receiveChainInput ?? ''}
              onChange={(value) =>
                setUserFormState((state) => ({
                  ...state,
                  receiveChainInput: value,
                }))
              }
              dialogRootNode={rootNode}
              filterPredicate={networkSupportsBridging}
            />
          </HStack>
          <VStack gap={4}>
            <SpendTokenField
              spendInput={spendInput}
              spendChain={spendChain}
              spendAsset={spendAsset}
              spendPosition={spendPosition}
              availableSpendPositions={availableSpendPositions?.sorted ?? []}
              receiveInput={receiveInput}
              receiveAsset={receiveAsset}
              onChangeAmount={(value) => handleChange('spendInput', value)}
              onChangeToken={(value) =>
                handleTokenChange('spendTokenInput', value)
              }
            />
            <ReceiveTokenField
              receiveInput={receiveInput}
              receiveChain={receiveChain}
              receiveAsset={receiveAsset}
              receivePosition={receivePosition}
              availableReceivePositions={
                availableReceivePositions?.sorted ?? []
              }
              spendInput={spendInput}
              spendAsset={spendAsset}
              onChangeAmount={(value) => handleChange('receiveInput', value)}
              onChangeToken={(value) =>
                handleTokenChange('receiveTokenInput', value)
              }
            />
          </VStack>
        </VStack>
      </form>

      <Spacer height={16} />
      <VStack gap={8}>
        <VStack
          gap={8}
          style={
            quotesData.quote || quotesData.isLoading || quotesData.error
              ? {
                  borderRadius: 12,
                  border: '2px solid var(--neutral-200)',
                  padding: '12px 16px',
                }
              : undefined
          }
        >
          <RateLine
            spendAsset={spendAsset}
            receiveAsset={receiveAsset}
            quotesData={quotesData}
          />
          {currentTransaction && spendChain && currentTransaction.gasLimit ? (
            <React.Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'end' }}>
                  <CircleSpinner />
                </div>
              }
            >
              <TransactionConfiguration
                keepPreviousData={true}
                transaction={currentTransaction}
                from={address}
                chain={spendChain}
                paymasterEligible={false}
                paymasterPossible={false}
                paymasterWaiting={false}
                onFeeValueCommonReady={handleFeeValueCommonReady}
                configuration={txConfiguration}
                onConfigurationChange={(value) => setTxConfiguration(value)}
                gasback={null}
              />
            </React.Suspense>
          ) : null}
        </VStack>
        {quote ? <ProtocolFeeLine quote={quote} /> : null}
      </VStack>
      <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
        <HiddenValidationInput
          form={formId}
          customValidity={
            currentTransaction
              ? ''
              : 'Form is not ready. Please check your network, gas token amount and input values'
          }
        />
      </div>

      <VStack gap={16} style={{ marginTop: 'auto' }}>
        <AnimatedAppear display={showApproveHintLine}>
          <HStack gap={12} alignItems="center">
            <ApproveHintLine approved={enough_allowance} actionName="Bridge" />
            {approveMutation.isLoading || approveTxStatus === 'pending' ? (
              <CircleSpinner />
            ) : null}
          </HStack>
        </AnimatedAppear>
        <AnimatedAppear
          display={showApproveHintLine}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}
        >
          <div
            style={{
              height: 1,
              width: '100%',
              backgroundColor: 'var(--neutral-300)',
            }}
          />
        </AnimatedAppear>
        {isApproveMode ? (
          <>
            <input
              type="hidden"
              name="submit_type"
              value="approve"
              form={formId}
            />
            <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
              <UIText kind="body/regular" color="var(--negative-500)">
                {approveMutation.isError
                  ? txErrorToMessage(approveMutation.error)
                  : null}
              </UIText>
              {wallet ? (
                <SignTransactionButton
                  ref={approveTxBtnRef}
                  form={formId}
                  wallet={wallet}
                  disabled={
                    approvalTransactionIsFetching ||
                    approveMutation.isLoading ||
                    approveTxStatus === 'pending'
                  }
                  holdToSign={false}
                >
                  Approve {spendPosition?.asset.symbol ?? null}
                </SignTransactionButton>
              ) : null}
            </VStack>
          </>
        ) : (
          <>
            <input
              type="hidden"
              name="submit_type"
              value="bridge"
              form={formId}
            />
            <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
              <UIText kind="body/regular" color="var(--negative-500)">
                {sendTransactionMutation.isError
                  ? txErrorToMessage(sendTransactionMutation.error)
                  : null}
              </UIText>
              {wallet ? (
                <FormHint
                  spendInput={spendInput}
                  spendPosition={spendPosition}
                  quotesData={quotesData}
                  render={(hint) => (
                    <SignTransactionButton
                      ref={sendTxBtnRef}
                      form={formId}
                      wallet={wallet}
                      style={{ marginTop: 'auto' }}
                      disabled={
                        isLoading ||
                        quotesData.isLoading ||
                        Boolean(
                          (quote && !bridgeTransaction) || quotesData.error
                        )
                      }
                      holdToSign={false}
                    >
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hint ||
                          (quotesData.isLoading
                            ? 'Fetching offers'
                            : isLoading
                            ? 'Sending...'
                            : 'Send')}
                      </span>
                    </SignTransactionButton>
                  )}
                />
              ) : null}
            </VStack>
          </>
        )}
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function BridgeForm() {
  const { preferences } = usePreferences();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" />;
  }
  // TODO: We might want to save/restore last used chain here,
  // as we do in SwapFormPrepareChain
  return <BridgeFormComponent />;
}
