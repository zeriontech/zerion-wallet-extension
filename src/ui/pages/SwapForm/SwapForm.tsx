import { useSelectorStore } from '@store-unit/react';
import {
  client,
  useAddressMembership,
  useAddressPortfolioDecomposition,
  useAddressPositions,
} from 'defi-sdk';
import type { SwapFormState, SwapFormView } from '@zeriontech/transactions';
import { useSwapForm } from '@zeriontech/transactions';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { getNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import { createChain } from 'src/modules/networks/Chain';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { StoreWatcher } from 'src/ui/shared/StoreWatcher';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { baseToCommon, commonToBase } from 'src/shared/units/convert';
import { getAddress, getDecimals } from 'src/modules/networks/asset';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { useEvent } from 'src/ui/shared/useEvent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useTransactionStatus } from 'src/ui/transactions/useLocalTransactionStatus';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { TransactionConfirmationView } from 'src/ui/components/address-action/TransactionConfirmationView';
import { AnimatedAppear } from 'src/ui/components/AnimatedAppear';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import { isPremiumMembership } from 'src/ui/shared/requests/premium/isPremiumMembership';
import type { SendTxBtnHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useSizeStore } from 'src/ui/Onboarding/useSizeStore';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { Navigate, useNavigate } from 'react-router-dom';
import { isNumeric } from 'src/shared/isNumeric';
import {
  createApproveAddressAction,
  createTradeAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { UNLIMITED_APPROVAL_AMOUNT } from 'src/modules/ethereum/constants';
import { AllowanceForm } from 'src/ui/components/AllowanceForm';
import BigNumber from 'bignumber.js';
import { usePreferences } from 'src/ui/features/preferences';
import { useCurrency } from 'src/modules/currency/useCurrency';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { SpendTokenField } from './fieldsets/SpendTokenField';
import { ReceiveTokenField } from './fieldsets/ReceiveTokenField';
import { RateLine } from './Quotes';
import type { QuotesData } from './Quotes/useQuotes';
import { useQuotes } from './Quotes/useQuotes';
import { SuccessState } from './SuccessState';
import * as styles from './styles.module.css';
import { ApproveHintLine } from './ApproveHintLine';
import { useApproveHandler } from './shared/useApproveHandler';
import {
  BottomArc,
  ReverseButton,
  TopArc,
} from './reverse/reverse-button-helpers';
import { ProtocolFeeLine } from './shared/ProtocolFeeLine';
import { SlippageSettings } from './SlippageSettings';
import { getQuotesErrorMessage } from './Quotes/getQuotesErrorMessage';

const rootNode = getRootDomNode();

function FormHint({
  swapView,
  quotesData,
  render,
}: {
  swapView: SwapFormView;
  quotesData: QuotesData;
  render: (message: string | null) => React.ReactNode;
}) {
  const { spendPosition } = swapView;
  const { spendInput, receiveInput, primaryInput } = useSelectorStore(
    swapView.store,
    ['spendInput', 'receiveInput', 'primaryInput']
  );

  const value = primaryInput === 'spend' ? spendInput : receiveInput;
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

export function SwapFormComponent() {
  useBackgroundKind({ kind: 'white' });
  const { singleAddress: address, ready } = useAddressParams();
  const { currency } = useCurrency();

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { value: positionsValue } = useAddressPositions({
    address,
    currency,
  });
  const positions = positionsValue?.positions ?? null;

  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition(
    {
      address,
      currency,
    },
    { enabled: ready }
  );
  const addressChains = useMemo(
    () => Object.keys(portfolioDecomposition?.chains || {}),
    [portfolioDecomposition]
  );

  const { networks } = useNetworks(addressChains);
  const { supportedChains } = useMemo(() => {
    const allItems = networks?.getNetworks() || [];
    const itemsForTrading = networks
      ? allItems.filter((network) =>
          networks.supports('trading', createChain(network.id))
        )
      : [];
    return {
      supportedChains: itemsForTrading.map((network) =>
        createChain(network.id)
      ),
    };
  }, [networks]);

  const swapView = useSwapForm({
    currency,
    client,
    positions,
    asset_code: null,
    getNativeAsset: ({ chain }) => getNativeAsset({ chain, currency }),
    supportedChains,
    DEFAULT_CONFIGURATION,
  });

  const { primaryInput, chainInput, spendInput } = useSelectorStore(
    swapView.store,
    ['chainInput', 'spendInput', 'primaryInput']
  );
  const chain = chainInput ? createChain(chainInput) : null;
  const { spendPosition, receivePosition, handleChange } = swapView;

  const formRef = useRef<HTMLFormElement | null>(null);
  const quotesData = useQuotes({ address, swapView });
  const {
    transaction: swapTransaction,
    quote,
    refetch: refetchQuotes,
  } = quotesData;

  useEffect(() => {
    if (!quote) {
      const opposite =
        primaryInput === 'receive' ? 'spendInput' : 'receiveInput';
      handleChange(opposite, '');
    } else if (primaryInput === 'spend' && chain && receivePosition) {
      const value = quote.output_amount_estimation || 0;
      const decimals = getDecimals({ asset: receivePosition.asset, chain });
      handleChange('receiveInput', baseToCommon(value, decimals).toFixed());
    } else if (primaryInput === 'receive' && chain && spendPosition) {
      const value = quote.input_amount_estimation || 0;
      const decimals = getDecimals({ asset: spendPosition.asset, chain });
      handleChange('spendInput', baseToCommon(value, decimals).toFixed());
    }
  }, [
    chain,
    handleChange,
    primaryInput,
    quote,
    receivePosition,
    spendPosition,
  ]);

  const snapshotRef = useRef<SwapFormState | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = swapView.store.getState();
  };

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const { data: gasPrices } = useGasPrices(chain);

  const configureTransactionToBeSigned = useEvent((tx: IncomingTransaction) => {
    invariant(chain && networks, 'Not ready to prepare the transaction');
    const chainId = networks.getChainId(chain);
    invariant(
      chainId,
      'chainId should exist for creating an approve transaction'
    );
    const configuration = swapView.store.configuration.getState();
    const txToSign = applyConfiguration(tx, configuration, gasPrices);
    return { ...txToSign, from: address, chainId };
  });

  const spendAmountBase = useMemo(
    () =>
      spendInput && spendPosition && chain
        ? commonToBase(
            spendInput,
            getDecimals({ asset: spendPosition.asset, chain })
          ).toFixed()
        : null,
    [chain, spendInput, spendPosition]
  );

  const [allowanceQuantityBase, setAllowanceQuantityBase] =
    useState(spendAmountBase);

  useEffect(() => setAllowanceQuantityBase(spendAmountBase), [spendAmountBase]);

  const contractAddress =
    spendPosition && chain
      ? getAddress({ asset: spendPosition.asset, chain }) ?? null
      : null;
  const {
    enough_allowance,
    allowanceQuery: { refetch: refetchAllowanceQuery },
    approvalTransactionQuery: { isFetching: approvalTransactionIsFetching },
    approvalTransaction,
  } = useApproveHandler({
    address,
    chain,
    spendAmountBase,
    allowanceQuantityBase,
    spender: quote?.token_spender ?? null,
    contractAddress,
    enabled: quotesData.done && Boolean(quote && !quote.enough_allowance),
    keepPreviousData: false,
  });

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);
  const approveTxBtnRef = useRef<SendTxBtnHandle | null>(null);

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

      invariant(chain, 'Chain must be defined to sign the tx');
      invariant(approveTxBtnRef.current, 'SignTransactionButton not found');
      invariant(spendPosition, 'Spend position must be defined');
      invariant(quote, 'Cannot submit transaction without a quote');

      const txResponse = await approveTxBtnRef.current.sendTransaction({
        transaction,
        chain: chain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Swap',
        feeValueCommon,
        addressAction: createApproveAddressAction({
          transaction: { ...transaction, from: address },
          asset: spendPosition.asset,
          quantity: quote.input_amount_estimation,
          chain,
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
    } else if (approveTxStatus === 'failed' || approveTxStatus === 'dropped') {
      resetApproveMutation();
    }
  }, [
    approveTxStatus,
    refetchAllowanceQuery,
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
      invariant(
        quote?.transaction,
        'Cannot submit transaction without a quote'
      );
      const transaction = configureTransactionToBeSigned(quote.transaction);
      const feeValueCommon = feeValueCommonRef.current || null;
      invariant(chain, 'Chain must be defined to sign the tx');
      invariant(
        spendPosition && receivePosition,
        'Trade positions must be defined'
      );
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      const spendValue = quote.input_amount_estimation;
      const receiveValue = quote.output_amount_estimation;
      const txResponse = await sendTxBtnRef.current.sendTransaction({
        transaction,
        chain: chain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Swap',
        feeValueCommon,
        addressAction: createTradeAddressAction({
          transaction,
          outgoing: [{ asset: spendPosition.asset, quantity: spendValue }],
          incoming: [{ asset: receivePosition.asset, quantity: receiveValue }],
          chain,
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
    swapView.store.on('change', (state, prevState) => {
      const keys = [
        'chainInput',
        'spendInput',
        'spendTokenInput',
        'receiveTokenInput',
      ] as const;
      if (keys.some((key) => state[key] !== prevState[key])) {
        resetMutationIfNotLoading();
        resetApproveMutation();
      }
    });
  }, [resetApproveMutation, resetMutationIfNotLoading, swapView.store]);

  const formId = useId();

  const allowanceDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const slippageDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { value: premiumValue } = useAddressMembership({ address });
  const isPremium = isPremiumMembership(premiumValue);
  useEffect(() => {
    if (!isPremium) {
      handleChange('primaryInput', 'spend');
    }
  }, [handleChange, isPremium]);

  const { innerHeight } = useSizeStore();

  const navigate = useNavigate();

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
        swapFormState={snapshotRef.current}
        onDone={() => {
          reset();
          snapshotRef.current = null;
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
    : swapTransaction;

  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle
        title="Swap"
        elementEnd={
          <HStack
            gap={8}
            alignItems="center"
            // place element at the edge of PageColumn
            style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
          >
            <Button
              kind="ghost"
              size={36}
              style={{ padding: 6 }}
              title="Swap settings"
              onClick={() => slippageDialogRef.current?.showModal()}
            >
              <SettingsIcon style={{ display: 'block' }} />
            </Button>
            <UnstyledLink to="/wallet-select" title="Change Wallet">
              <WalletAvatar
                active={false}
                address={address}
                size={24}
                borderRadius={4}
              />
            </UnstyledLink>
          </HStack>
        }
      />
      <BottomSheetDialog
        ref={slippageDialogRef}
        height="min-content"
        renderWhenOpen={() => (
          <>
            <DialogTitle
              alignTitle="start"
              title={
                <HStack gap={4} alignItems="center">
                  <UIText kind="headline/h3">Slippage</UIText>
                  <div
                    style={{ cursor: 'help' }}
                    title="Your transaction will revert if the price changes unfavourably by more than this percentage"
                  >
                    <QuestionHintIcon
                      style={{ display: 'block', color: 'var(--neutral-500)' }}
                    />
                  </div>
                </HStack>
              }
            />
            <Spacer height={24} />
            <StoreWatcher
              store={swapView.store.configuration}
              render={(configuration) => (
                <SlippageSettings
                  configuration={configuration}
                  onConfigurationChange={(value) => {
                    swapView.store.configuration.setState(value);
                    slippageDialogRef.current?.close();
                  }}
                />
              )}
            />
          </>
        )}
      />

      <BottomSheetDialog
        ref={confirmDialogRef}
        key={currentTransaction === approvalTransaction ? 'approve' : 'swap'}
        height={innerHeight >= 750 ? '70vh' : '90vh'}
        containerStyle={{ display: 'flex', flexDirection: 'column' }}
        renderWhenOpen={() => {
          invariant(
            currentTransaction,
            'Transaction must be defined to confirm'
          );
          invariant(wallet, 'Current wallet not found');
          invariant(chain, 'Chain must be defined');
          return (
            <ViewLoadingSuspense>
              <TransactionConfirmationView
                title={
                  currentTransaction === approvalTransaction
                    ? 'Approve'
                    : 'Trade'
                }
                wallet={wallet}
                showApplicationLine={true}
                chain={chain}
                transaction={configureTransactionToBeSigned(currentTransaction)}
                configuration={swapView.store.configuration.getState()}
                localAllowanceQuantityBase={allowanceQuantityBase || undefined}
                onOpenAllowanceForm={() =>
                  allowanceDialogRef.current?.showModal()
                }
                paymasterEligible={false}
                eligibilityQuery={{
                  data: { data: { eligible: false } },
                  isError: false,
                }}
              />
            </ViewLoadingSuspense>
          );
        }}
      />

      <BottomSheetDialog
        ref={allowanceDialogRef}
        height="min-content"
        renderWhenOpen={() => {
          invariant(chain, 'Chain must be defined');
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
                    chain={chain}
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
              } else if (submitType === 'swap') {
                sendTransaction();
              } else {
                throw new Error('Must set a submit_type to form');
              }
            });
          }
        }}
      >
        <VStack gap={16}>
          <NetworkSelect
            value={chainInput ?? ''}
            onChange={(value) => {
              swapView.handleChange('chainInput', value);
            }}
            dialogRootNode={rootNode}
            filterPredicate={(network) =>
              networks?.supports('trading', createChain(network.id)) || false
            }
          />
          <VStack gap={4} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <div className={styles.arcParent}>
                <SpendTokenField swapView={swapView} />
                <BottomArc />
              </div>
              <ReverseButton onClick={() => swapView.store.reverseTokens()} />
            </div>
            <div className={styles.arcParent}>
              <TopArc />
              <ReceiveTokenField swapView={swapView} readOnly={!isPremium} />
            </div>
          </VStack>
        </VStack>
      </form>
      <Spacer height={16} />
      <VStack gap={8}>
        <RateLine swapView={swapView} quotesData={quotesData} />
        {currentTransaction && chain && currentTransaction.gas ? (
          <React.Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <CircleSpinner />
              </div>
            }
          >
            <StoreWatcher
              store={swapView.store.configuration}
              render={(configuration) => (
                <TransactionConfiguration
                  keepPreviousData={true}
                  transaction={currentTransaction}
                  from={address}
                  chain={chain}
                  paymasterEligible={false}
                  onFeeValueCommonReady={handleFeeValueCommonReady}
                  configuration={configuration}
                  onConfigurationChange={(value) =>
                    swapView.store.configuration.setState(value)
                  }
                />
              )}
            />
            {quote ? <ProtocolFeeLine quote={quote} /> : null}
          </React.Suspense>
        ) : null}
      </VStack>
      <VStack gap={16} style={{ marginTop: 'auto' }}>
        <AnimatedAppear display={showApproveHintLine}>
          <HStack gap={12} alignItems="center">
            <ApproveHintLine approved={enough_allowance} actionName="Swap" />
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
              value="swap"
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
                  quotesData={quotesData}
                  swapView={swapView}
                  render={(hint) => (
                    <SignTransactionButton
                      ref={sendTxBtnRef}
                      form={formId}
                      wallet={wallet}
                      style={{ marginTop: 'auto' }}
                      disabled={
                        isLoading ||
                        quotesData.isLoading ||
                        Boolean((quote && !swapTransaction) || quotesData.error)
                      }
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
                            : 'Swap')}
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

export function SwapForm() {
  const { preferences } = usePreferences();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" />;
  }
  return <SwapFormComponent />;
}
