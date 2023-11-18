import { useSelectorStore } from '@store-unit/react';
import { client, useAddressPositions } from 'defi-sdk';
import { type SwapFormState, useSwapForm } from '@zeriontech/transactions';
import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import ReverseIcon from 'jsx:src/ui/assets/reverse.svg';
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
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { useEvent } from 'src/ui/shared/useEvent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useTransactionStatus } from 'src/ui/transactions/useLocalTransactionStatus';
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
import { Appear } from './ApproveHintLine/ApproveHintLine';

const rootNode = getRootDomNode();

export function SwapForm() {
  useBackgroundKind({ kind: 'white' });
  const { singleAddress: address } = useAddressParams();
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

  const quotesData = useQuotes({ address, swapView });
  const { transaction, quote } = quotesData;

  useEffect(() => {
    if (!quote) {
      const opposite =
        primaryInput === 'receive' ? 'spendInput' : 'receiveInput';
      handleChange(opposite, '');
    } else if (primaryInput === 'spend' && chain && receivePosition) {
      console.log(
        'updated receive position',
        receivePosition.asset.symbol,
        quote
      );
      const value = quote.output_amount_estimation || 0;
      const decimals = getDecimals({ asset: receivePosition.asset, chain });
      handleChange('receiveInput', baseToCommon(value, decimals).toFixed());
    } else if (primaryInput === 'receive' && chain && spendPosition) {
      console.log('updated spend position', spendPosition.asset.symbol, quote);
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
  });

  const approveTxStatus = useTransactionStatus(approveHash ?? null);
  useEffect(() => {
    if (approveTxStatus === 'confirmed') {
      refetchAllowanceQuery();
    } else if (approveTxStatus === 'failed' || approveTxStatus === 'dropped') {
      resetApproveMutation();
    }
  }, [approveTxStatus, refetchAllowanceQuery, resetApproveMutation]);
  const quoteId = quote
    ? `${quote.token_spender}-${quote.input_token_address}`
    : null;
  useEffect(() => {
    resetApproveMutation();
  }, [quoteId, resetApproveMutation]);

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
      return '0x123abcd';
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

  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle
        title="Swap"
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
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();

          if (event.currentTarget.checkValidity()) {
            console.log(
              'type',
              new FormData(event.currentTarget).get('submit_type')
            );
            const submitType = new FormData(event.currentTarget).get(
              'submit_type'
            );
            if (submitType === 'approve') {
              sendApproveTransaction();
            } else if (submitType === 'swap') {
              sendTransaction();
            } else {
              throw new Error('Must set a submit_type to form');
            }
            // sendTransaction();
          }
          // invariant(confirmDialogRef.current, 'Dialog not found');
          // showConfirmDialog(confirmDialogRef.current).then(() => {
          //   send();
          // });
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
            <SpendTokenField swapView={swapView} />
            <UnstyledButton
              type="button"
              className={styles.reverseButton}
              onClick={() => swapView.store.reverseTokens()}
            >
              <ReverseIcon style={{ color: 'var(--neutral-500)' }} />
            </UnstyledButton>
            <ReceiveTokenField swapView={swapView} />
          </VStack>
        </VStack>
      </form>
      <Spacer height={16} />
      <VStack gap={8}>
        <RateLine swapView={swapView} quotesData={quotesData} />
        {transaction && chain && transaction.gas ? (
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
                  transaction={transaction}
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
          </React.Suspense>
        ) : null}
      </VStack>
      <VStack gap={16} style={{ marginTop: 'auto' }}>
        <Appear
          display={
            (quotesData.done && !enough_allowance) || !approveMutation.isIdle
          }
        >
          <HStack gap={12} alignItems="center">
            <ApproveHintLine approved={enough_allowance} actionName="Swap" />
            {approveMutation.isLoading || approveTxStatus === 'pending' ? (
              <CircleSpinner />
            ) : null}
          </HStack>
        </Appear>
        <div
          style={{
            height: 1,
            width: '100%',
            backgroundColor: 'var(--neutral-300)',
          }}
        />
        {approveMutation.isLoading ||
        (quotesData.done && !enough_allowance) ||
        approveTxStatus === 'pending' ? (
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
            <Button
              form={formId}
              kind="primary"
              disabled={isLoading || quotesData.isLoading}
            >
              Swap
            </Button>
          </>
        )}
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
