import { useSelectorStore } from '@store-unit/react';
import { client, useAddressMembership, useAddressPositions } from 'defi-sdk';
import type { SwapFormState, SwapFormView } from '@zeriontech/transactions';
import { useSwapForm } from '@zeriontech/transactions';
import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
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
import type { FormErrorDescription } from 'src/ui/shared/forms/useFormValidity';
import { useFormValidity } from 'src/ui/shared/forms/useFormValidity';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import { isPremiumMembership } from 'src/ui/shared/requests/premium/isPremiumMembership';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../SendTransaction/TransactionConfiguration/applyConfiguration';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { SpendTokenField } from './fieldsets/SpendTokenField';
import { ReceiveTokenField } from './fieldsets/ReceiveTokenField';
import { RateLine } from './Quotes';
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

const rootNode = getRootDomNode();

function getSubmitHint({
  formError,
}: {
  formError: FormErrorDescription | null;
}) {
  if (formError) {
    const formMessages: Record<string, string> = {
      spendInput: 'Enter amount',
      receiveInput: 'Enter amount',
    };
    if (formError.name in formMessages) {
      return formMessages[formError.name];
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function FormHint({
  swapView,
  formError,
  render,
}: {
  swapView: SwapFormView;
  formError: FormErrorDescription | null;
  render: (message: string | null) => React.ReactNode;
}) {
  const { spendPosition } = swapView;
  const { spendInput } = useSelectorStore(swapView.store, ['spendInput']);

  const positionBalanceCommon = spendPosition
    ? getPositionBalance(spendPosition)
    : null;
  const exceedsBalance = Number(spendInput) > Number(positionBalanceCommon);

  let message: string | null = null;
  if (exceedsBalance) {
    message = 'Insufficient balance';
  } else if (formError) {
    message = getSubmitHint({ formError });
  }
  return render(message);
}

export function SwapForm() {
  useBackgroundKind({ kind: 'white' });
  const { singleAddress: address } = useAddressParams();

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { value: positionsValue } = useAddressPositions({
    address,
    currency: 'usd',
  });
  const positions = positionsValue?.positions ?? null;

  const { networks } = useNetworks();
  const swapView = useSwapForm({
    currency: 'usd',
    client,
    positions,
    asset_code: null,
    getNativeAsset: ({ chain }) => getNativeAsset({ chain, currency: 'usd' }),
    supportedChains: useMemo(() => {
      if (networks) {
        return networks
          .getNetworks()
          .map((network) => createChain(network.chain))
          .filter((chain) => networks.supports('trading', chain));
      } else {
        return [];
      }
    }, [networks]),
    DEFAULT_CONFIGURATION,
  });
  Object.assign(window, { swapStore: swapView.store });
  const { primaryInput, chainInput, spendInput } = useSelectorStore(
    swapView.store,
    ['chainInput', 'spendInput', 'primaryInput']
  );
  const chain = chainInput ? createChain(chainInput) : null;
  const { spendPosition, receivePosition, handleChange } = swapView;

  const formRef = useRef<HTMLFormElement | null>(null);
  const { validity, handleFormChange } = useFormValidity({ formRef });
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
  const contractAddress =
    spendPosition && chain
      ? getAddress({ asset: spendPosition.asset, chain }) ?? null
      : null;
  const {
    enough_allowance,
    transaction: approveTransaction,
    allowanceQuery: { refetch: refetchAllowanceQuery },
  } = useApproveHandler({
    address,
    chain,
    spendAmountBase,
    spender: quote?.token_spender ?? null,
    contractAddress,
  });

  const {
    mutate: sendApproveTransaction,
    data: approveHash,
    reset: resetApproveMutation,
    ...approveMutation
  } = useMutation({
    mutationFn: async () => {
      invariant(approveTransaction, 'approve transaction is not configured');
      const transaction = configureTransactionToBeSigned(approveTransaction);
      const feeValueCommon = feeValueCommonRef.current || null;
      const txResponse = await walletPort.request('signAndSendTransaction', [
        transaction,
        { initiator: INTERNAL_ORIGIN, feeValueCommon },
      ]);
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

  useEffect(() => {
    swapView.store.on('change', (state, prevState) => {
      const keys = [
        'chainInput',
        'spendInput',
        'spendTokenInput',
        'receiveTokenInput',
      ] as const;
      if (keys.some((key) => state[key] !== prevState[key])) {
        resetApproveMutation();
      }
    });
  }, [resetApproveMutation, swapView.store]);

  const {
    mutate: sendTransaction,
    data: transactionHash,
    isLoading,
    reset,
    isSuccess,
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

  const formId = useId();

  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { value: premiumValue } = useAddressMembership({ address });
  const isPremium = isPremiumMembership(premiumValue);
  useEffect(() => {
    if (!isPremium) {
      handleChange('primaryInput', 'spend');
    }
  }, [handleChange, isPremium]);

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
    ? approveTransaction
    : swapTransaction;
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle
        title="Swap"
        elementEnd={
          <UnstyledLink
            to="/wallet-select"
            title="Change Wallet"
            // place element at the edge of PageColumn
            style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
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
        key={currentTransaction === approveTransaction ? 'approve' : 'swap'}
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
                  currentTransaction === approveTransaction
                    ? 'Approve'
                    : 'Spend'
                }
                wallet={wallet}
                chain={chain}
                transaction={configureTransactionToBeSigned(currentTransaction)}
                configuration={swapView.store.configuration.getState()}
              />
            </ViewLoadingSuspense>
          );
        }}
      ></BottomSheetDialog>
      <form
        id={formId}
        ref={formRef}
        onChange={handleFormChange}
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
            <Button
              form={formId}
              kind="primary"
              disabled={
                approveMutation.isLoading || approveTxStatus === 'pending'
              }
            >
              Approve {spendPosition?.asset.symbol ?? null}
            </Button>
          </>
        ) : (
          <>
            <input
              type="hidden"
              name="submit_type"
              value="swap"
              form={formId}
            />
            <FormHint
              formError={validity.formError}
              swapView={swapView}
              render={(hint) => (
                <Button
                  form={formId}
                  kind="primary"
                  disabled={
                    isLoading ||
                    quotesData.isLoading ||
                    Boolean(quote && !swapTransaction)
                  }
                >
                  {hint ||
                    (quotesData.isLoading
                      ? 'Fetching offers'
                      : isLoading
                      ? 'Sending...'
                      : 'Swap')}
                </Button>
              )}
            />
          </>
        )}
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
