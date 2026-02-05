import {
  Navigate,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom';
import type { AddressPosition } from 'defi-sdk';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { sortPositionsByValue } from '@zeriontech/transactions';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import WarningIcon from 'jsx:src/ui/assets/warning.svg';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworkConfig } from 'src/modules/networks/useNetworks';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { commonToBase } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
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
import type { SendTxBtnHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { isNumeric } from 'src/shared/isNumeric';
import {
  createApproveAddressAction,
  createTradeAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { AllowanceForm } from 'src/ui/components/AllowanceForm';
import BigNumber from 'bignumber.js';
import { usePreferences } from 'src/ui/features/preferences';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import {
  queryHttpAddressPositions,
  useHttpAddressPositions,
} from 'src/modules/zerion-api/hooks/useWalletPositions';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import { useGasbackEstimation } from 'src/modules/ethereum/account-abstraction/rewards';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { useQuotes2 } from 'src/ui/shared/requests/useQuotes';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { getDefaultChain } from 'src/ui/shared/forms/trading/getDefaultChain';
import { getHttpClientSource } from 'src/modules/zerion-api/getHttpClientSource';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import type { Quote2 } from 'src/shared/types/Quote';
import {
  toIncomingTransaction,
  toMultichainTransaction,
} from 'src/shared/types/Quote';
import { modifyApproveAmount } from 'src/modules/ethereum/transactions/appovals';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { ensureSolanaResult } from 'src/modules/shared/transactions/helpers';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { Networks } from 'src/modules/networks/Networks';
import { useUKDetection } from 'src/ui/components/UKDisclaimer/useUKDetection';
import { UKDisclaimer } from 'src/ui/components/UKDisclaimer/UKDisclaimer';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import { PremiumFormBanner } from 'src/ui/features/premium/banners/FormBanner';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { NetworkSelect } from '../Networks/NetworkSelect';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { fromConfiguration, toConfiguration } from '../SendForm/shared/helpers';
import { NetworkFeeLineInfo } from '../SendTransaction/TransactionConfiguration/TransactionConfiguration';
import { TransactionWarning } from '../SendTransaction/TransactionWarnings/TransactionWarning';
import { RateLine } from './Quotes';
import * as styles from './styles.module.css';
import { ApproveHintLine } from './ApproveHintLine';
import {
  BottomArc,
  ReverseButton,
  TopArc,
} from './reverse/reverse-button-helpers';
import { SlippageSettings } from './SlippageSettings';
import { getQuotesErrorMessage } from './Quotes/getQuotesErrorMessage';
import { SlippageLine } from './SlippageSettings/SlippageLine';
import { getPopularTokens } from './shared/getPopularTokens';
import type { PriceImpact } from './shared/price-impact';
import {
  calculatePriceImpact,
  getPriceImpactPercentage,
  NOT_BLOCKING_PRICE_IMPACT,
} from './shared/price-impact';
import { PriceImpactLine } from './shared/PriceImpactLine';
import { SpendTokenField } from './fieldsets/SpendTokenField/SpendTokenField';
import { ReceiveTokenField } from './fieldsets/ReceiveTokenField/ReceiveTokenField';
import { SuccessState } from './SuccessState/SuccessState';
import type { SwapFormState } from './shared/SwapFormState';
import { usePosition } from './shared/usePosition';
import { getSlippageOptions } from './SlippageSettings/getSlippageOptions';
import {
  BlockingWarningOverlay,
  getBlockingWarningProps,
} from './shared/BlockingWarningOverlay';

const rootNode = getRootDomNode();

function FormHint({
  formState,
  inputPosition,
  quotesData,
  priceImpact,
  selectedQuote,
  render,
}: {
  formState: SwapFormState;
  inputPosition: AddressPosition | EmptyAddressPosition | null;
  quotesData: QuotesData<Quote2>;
  priceImpact: PriceImpact | null;
  selectedQuote: Quote2 | null;
  render: (message: React.ReactNode | null) => React.ReactNode;
}) {
  const { inputAmount } = formState;

  const invalidValue = inputAmount && !isNumeric(inputAmount);
  const valueMissing = !inputAmount || Number(inputAmount) === 0;

  const positionBalanceCommon = inputPosition
    ? getPositionBalance(inputPosition)
    : null;
  const exceedsBalance = Number(inputAmount) > Number(positionBalanceCommon);

  const showPriceImpactWarning =
    selectedQuote?.transactionSwap &&
    !quotesData.isLoading &&
    (priceImpact?.kind === 'n/a' ||
      (priceImpact?.kind === 'loss' &&
        (priceImpact.level === 'medium' || priceImpact.level === 'high')));

  let hint: React.ReactNode | null = null;
  if (exceedsBalance) {
    hint = 'Insufficient balance';
  } else if (valueMissing) {
    hint = 'Enter amount';
  } else if (invalidValue) {
    hint = 'Incorrect amount';
  } else if (quotesData.error) {
    hint = getQuotesErrorMessage(quotesData);
  } else if (showPriceImpactWarning) {
    hint = (
      <HStack gap={8} alignItems="center" justifyContent="center">
        <WarningIcon
          style={{ width: 20, height: 20 }}
          color="var(--negative-500)"
        />
        <UIText kind="small/accent">Swap Anyway</UIText>
      </HStack>
    );
  }

  return render(hint);
}

async function filterSupportedPositionsOnSupportedChains(
  positions: AddressPosition[] | null
) {
  if (!positions) {
    return [];
  }
  const networksStore = await getNetworksStore();
  const chains = positions.map((position) => position.chain);
  const networks = await networksStore.load({ chains });
  const filteredPositions = positions.filter((position) => {
    const network = networks.getByNetworkId(createChain(position.chain));
    return position.type === 'asset' && network?.supports_trading;
  });
  return filteredPositions;
}

function getDefaultState({
  address,
  positions,
}: {
  address: string;
  positions: AddressPosition[] | null;
}): SwapFormState {
  return { inputChain: getDefaultChain(address, positions ?? []) };
}

async function queryPopularTokens(chain: Chain) {
  return queryClient.fetchQuery({
    queryKey: ['getPopularTokens', chain],
    queryFn: () => getPopularTokens(chain),
    staleTime: Infinity,
  });
}

/**
 * This value must be used until `prepareDefaultState` resolves
 * so that `formState` object has stable order of keys. This is important
 * for useQuotes helper which internally serializes formState into a URL string
 * and makes refetches when this url changes
 */
const EMPTY_DEFAULT_STATE = {
  inputChain: undefined,
  inputFungibleId: undefined,
  outputFungibleId: undefined,
};
async function prepareDefaultState({
  address,
  userStateInputChain,
  currency,
}: {
  address: string;
  userStateInputChain: string | null;
  currency: string;
}): Promise<SwapFormState> {
  const source = await getHttpClientSource();
  const { data: allPositions } = await queryHttpAddressPositions(
    { addresses: [address], currency },
    { source }
  );
  const networksStore = await getNetworksStore();
  const positionsOnSupportedChains =
    await filterSupportedPositionsOnSupportedChains(allPositions);
  const inputChain =
    userStateInputChain || getDefaultChain(address, positionsOnSupportedChains);
  const [network, popularTokens] = await Promise.all([
    networksStore.fetchNetworkById(inputChain),
    // TODO: this request takes and additional 0.5-1s for initial form load,
    // but it's very unimportant. We can make popular tokens an optional param of
    // prepareDefaultState and query it separately in the SwapForm component and pass it here.
    // This may lead to an additional flicker, but only in a certain case, and to an overall faster
    // form load
    queryPopularTokens(createChain(inputChain)).catch(() => {
      // we don't care a lot about these
      return [];
    }),
  ]);

  const positions = allPositions
    .filter((p) => p.chain === inputChain)
    .filter((p) => p.type === 'asset');
  const sorted = sortPositionsByValue(positions);
  const nativeAssetId = network.native_asset?.id;
  const defaultInputFungibleId = sorted.at(0)?.asset.id || nativeAssetId;
  const USDC_BACKEND_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const popularToken =
    popularTokens.find((id) => id !== nativeAssetId) ?? USDC_BACKEND_ID; // todo
  const defaultOutputFungibleId =
    defaultInputFungibleId === nativeAssetId ? popularToken : nativeAssetId;
  return {
    inputChain,
    inputFungibleId: defaultInputFungibleId,
    outputFungibleId: defaultOutputFungibleId,
  };
}

type HandleChangeFunction = <K extends keyof SwapFormState>(
  key: K,
  value: SwapFormState[K]
) => void;

function reverseTokens(state: SwapFormState) {
  const { outputFungibleId, inputFungibleId } = state;
  const newState: SwapFormState = {};
  if (outputFungibleId) {
    newState.inputFungibleId = outputFungibleId;
  }
  if (inputFungibleId) {
    newState.outputFungibleId = inputFungibleId;
  }
  return newState;
}

function changeAssetId<K extends keyof SwapFormState>(
  state: SwapFormState,
  key: K,
  value: SwapFormState[K]
) {
  const isSameAsOpposite =
    (key === 'inputFungibleId' && value === state.outputFungibleId) ||
    (key === 'outputFungibleId' && value === state.inputFungibleId);
  if (isSameAsOpposite) {
    const newState = reverseTokens(state);
    newState[key] = value;
    return newState;
  } else {
    return { [key]: value };
  }
}

function SwapFormComponent() {
  useBackgroundKind({ kind: 'white' });
  const { globalPreferences } = useGlobalPreferences();
  const { singleAddress: address, singleAddressNormalized } =
    useAddressParams();
  const { currency } = useCurrency();
  const { innerHeight } = useWindowSizeStore();

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const [userFormState, setUserFormState] = useSearchParamsObj<SwapFormState>();

  const refetchInterval = usePositionsRefetchInterval(20000);
  const httpAddressPositionsQuery = useHttpAddressPositions(
    { addresses: [singleAddressNormalized], currency },
    { source: useHttpClientSource() },
    { refetchInterval }
  );
  /** All backend-known positions across all _supported_ chains */
  const allPositions = httpAddressPositionsQuery.data?.data || null;
  const { data: positionsOnSupportedChains } = useQuery({
    queryKey: ['positionsOnSupportedChains', allPositions],
    queryFn: () => filterSupportedPositionsOnSupportedChains(allPositions),
    enabled: Boolean(allPositions),
    keepPreviousData: true,
  });

  const defaultFormValues = useMemo<SwapFormState>(
    () =>
      getDefaultState({
        address,
        positions: positionsOnSupportedChains || null,
      }),
    [address, positionsOnSupportedChains]
  );

  const preState = useMemo(
    () => ({ ...defaultFormValues, ...userFormState }),
    [userFormState, defaultFormValues]
  );

  const { data: defaultState = EMPTY_DEFAULT_STATE, ...defaultStateQuery } =
    useQuery({
      queryKey: [
        'prepareDefaultSwapState',
        singleAddressNormalized,
        currency,
        userFormState.inputChain,
      ],
      queryFn: async () => {
        const result = await prepareDefaultState({
          address: singleAddressNormalized,
          currency,
          userStateInputChain: userFormState.inputChain ?? null,
        });
        return result;
      },
      staleTime: Infinity,
      suspense: false,
      keepPreviousData: true,
    });

  const formState: SwapFormState = useMemo(
    () => ({ ...defaultState, ...preState }),
    [defaultState, preState]
  );

  const handleChange = useCallback<HandleChangeFunction>(
    (key, value) => setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  /** Same as handleChange, but reverses tokens if selected asset is same as the opposite one */
  const handleAssetChange = useEvent<HandleChangeFunction>((key, value) => {
    setUserFormState((state) => ({
      ...state,
      ...changeAssetId(formState, key, value),
    }));
  });

  const { inputAmount, inputFungibleId, inputChain, outputFungibleId } =
    formState;

  const availablePositions = useMemo(() => {
    const positions = allPositions
      ?.filter((p) => p.chain === inputChain)
      .filter((p) => p.type === 'asset');
    return sortPositionsByValue(positions);
  }, [allPositions, inputChain]);

  const spendChain = inputChain ? createChain(inputChain) : null;
  const { data: network } = useNetworkConfig(inputChain ?? null);

  const inputPosition = usePosition({
    assetId: inputFungibleId ?? null,
    positions: allPositions,
    chain: spendChain,
  });
  const outputPosition = usePosition({
    assetId: outputFungibleId ?? null,
    positions: allPositions,
    chain: spendChain,
  });

  const allowanceDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const slippageDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const blockingWarningDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);
  const approveTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const formId = useId();

  const inputChainAddressMatch =
    network && isMatchForEcosystem(address, Networks.getEcosystem(network));
  const inputChainAddressMismatch = network && !inputChainAddressMatch;

  const { pathname } = useLocation();
  const quotesData = useQuotes2({
    address: singleAddressNormalized,
    currency,
    formState,
    enabled:
      defaultStateQuery.isFetched &&
      !defaultStateQuery.isPreviousData &&
      inputChainAddressMatch,
    context: 'Swap',
    pathname,
  });
  const { refetch: refetchQuotes } = quotesData;

  const [userQuoteId, setUserQuoteId] = useState<string | null>(null);
  useEffect(() => {
    setUserQuoteId(null);
  }, [inputAmount, inputFungibleId, outputFungibleId, inputChain]);

  const selectedQuote = useMemo(() => {
    const userQuote = quotesData.quotes?.find(
      (quote) => quote.contractMetadata?.id === userQuoteId
    );
    const defaultQuote = quotesData.quotes?.[0];
    return userQuote || defaultQuote || null;
  }, [userQuoteId, quotesData.quotes]);

  const handleQuoteErrorEvent = useEvent((message: string, quote: Quote2) => {
    if (!inputFungibleId || !outputFungibleId || !inputAmount || !inputChain) {
      return;
    }
    walletPort.request('quoteError', {
      message,
      backendMessage: message,
      context: 'Swap',
      actionType: 'Trade',
      type: 'Trade form error',
      address,
      inputFungibleId,
      outputFungibleId,
      inputAmount,
      inputChain,
      outputAmount: quote.outputAmount.quantity || null,
      outputChain: null,
      contractType: quote.contractMetadata?.name || null,
      pathname,
      slippage: getSlippageOptions({
        chain: createChain(inputChain),
        userSlippage:
          formState.slippage != null ? Number(formState.slippage) : null,
      }).slippagePercent,
    });
  });

  useEffect(() => {
    const errorMessage = selectedQuote?.error?.message;
    if (errorMessage && quotesData.done) {
      handleQuoteErrorEvent(errorMessage, selectedQuote);
    }
  }, [selectedQuote, quotesData.done, handleQuoteErrorEvent]);

  const { data: gasbackEstimation } = useGasbackEstimation({
    paymasterEligible: Boolean(
      selectedQuote?.transactionSwap?.evm?.customData?.paymasterParams
    ),
    suppportsSimulations: network?.supports_simulations ?? false,
    supportsSponsoredTransactions: network?.supports_sponsored_transactions,
  });

  const currentTransaction =
    selectedQuote?.transactionApprove || selectedQuote?.transactionSwap || null;

  const [selectedForSignQuote, setSelectedForSignQuote] =
    useState<Quote2 | null>(null);
  const selectedForSignTransaction =
    selectedForSignQuote?.transactionApprove ||
    selectedForSignQuote?.transactionSwap ||
    null;

  const [allowanceBase, setAllowanceBase] = useState<string | null>(null);

  useEffect(() => setAllowanceBase(null), [inputAmount, inputFungibleId]);

  const { data: inputFungibleUsdInfoForAnalytics } = useAssetFullInfo(
    { fungibleId: inputPosition?.asset.id || '', currency: 'usd' },
    { source: useHttpClientSource() },
    { enabled: Boolean(inputPosition?.asset.id) }
  );

  const {
    mutate: sendApproveTransaction,
    data: approveData,
    reset: resetApproveMutation,
    ...approveMutation
  } = useMutation({
    mutationFn: async (interpretationAction: AddressAction | null) => {
      invariant(
        selectedForSignQuote?.transactionApprove?.evm,
        'Approval transaction is not configured'
      );

      invariant(network, 'Network must be defined to sign the tx');
      invariant(spendChain, 'Chain must be defined to sign the tx');
      invariant(approveTxBtnRef.current, 'SignTransactionButton not found');
      invariant(inputPosition, 'Spend position must be defined');
      invariant(formState.inputAmount, 'inputAmount must be set');

      const evmTx = selectedForSignQuote.transactionApprove.evm;
      const quoteId = selectedForSignQuote.contractMetadata?.id || null;
      const isPaymasterTx = Boolean(evmTx.customData?.paymasterParams);
      const approvalTx =
        allowanceBase && !isPaymasterTx
          ? await modifyApproveAmount(evmTx, allowanceBase)
          : evmTx;

      const fallbackAddressAction = selectedForSignQuote.transactionApprove.evm
        ? createApproveAddressAction({
            transaction: toIncomingTransaction(
              selectedForSignQuote.transactionApprove.evm
            ),
            hash: null,
            explorerUrl: null,
            amount: {
              currency,
              quantity: formState.inputAmount,
              value: inputPosition.asset.price?.value
                ? new BigNumber(formState.inputAmount)
                    .multipliedBy(inputPosition.asset.price.value)
                    .toNumber()
                : null,
              usdValue: inputFungibleUsdInfoForAnalytics?.data?.fungible.meta
                .price
                ? new BigNumber(formState.inputAmount)
                    .multipliedBy(
                      inputFungibleUsdInfoForAnalytics.data.fungible.meta.price
                    )
                    .toNumber()
                : null,
            },
            asset: inputPosition.asset,
            network,
          })
        : null;

      const txResponse = await approveTxBtnRef.current.sendTransaction({
        transaction: { evm: toIncomingTransaction(approvalTx) },
        chain: spendChain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Swap',
        feeValueCommon:
          selectedForSignQuote.networkFee?.amount?.quantity || '0',
        addressAction: interpretationAction ?? fallbackAddressAction,
      });
      invariant(txResponse.evm?.hash);
      return { hash: txResponse.evm.hash, quoteId };
    },
    onSuccess: ({ quoteId }) => {
      setUserQuoteId(quoteId);
    },
  });

  const approveTxStatus = useTransactionStatus(approveData?.hash ?? null);

  useEffect(() => {
    if (approveTxStatus === 'confirmed') {
      refetchQuotes();
    } else if (approveTxStatus === 'failed' || approveTxStatus === 'dropped') {
      resetApproveMutation();
    }
  }, [resetApproveMutation, approveTxStatus, refetchQuotes]);

  const isApproveMode =
    approveMutation.isLoading ||
    Boolean(selectedQuote?.transactionApprove) ||
    approveTxStatus === 'pending';
  const showApproveHintLine =
    Boolean(selectedQuote?.transactionApprove) || !approveMutation.isIdle;

  const snapshotRef = useRef<{ state: SwapFormState } | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = { state: { ...formState } };
  };

  const outputAmount = selectedQuote?.outputAmount.quantity || null;

  const priceImpact = useMemo(() => {
    return calculatePriceImpact({
      inputValue: inputAmount || null,
      outputValue: outputAmount || null,
      inputAsset: inputPosition?.asset ?? null,
      outputAsset: outputPosition?.asset ?? null,
    });
  }, [inputAmount, inputPosition?.asset, outputAmount, outputPosition?.asset]);

  const showPriceImpactCallout =
    quotesData.done &&
    !isApproveMode &&
    (priceImpact?.kind === 'n/a' ||
      (priceImpact?.kind === 'loss' && priceImpact.level === 'high'));

  const showPriceImpactWarning =
    quotesData.done &&
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const trackTransactionFormed = useEvent((quote: Quote2) => {
    walletPort.request('transactionFormed', {
      formState,
      quote,
      scope: 'Swap',
      warningWasShown: Boolean(showPriceImpactCallout),
      outputAmountColor: showPriceImpactWarning ? 'red' : 'grey',
      enoughBalance:
        (inputPosition &&
          getPositionBalance(inputPosition)?.gte(
            new BigNumber(formState.inputAmount || 0)
          )) ??
        false,
      slippagePercent: formState.inputChain
        ? getSlippageOptions({
            chain: createChain(formState.inputChain),
            userSlippage:
              'slippage' in formState && formState.slippage
                ? Number(formState.slippage)
                : null,
          }).slippagePercent
        : undefined,
    });
  });

  const showQuotesLoadingState =
    // This case covers loading state when approve tx was just done and new quotes are being fetched
    (isApproveMode && quotesData.isPreviousData) ||
    (quotesData.isLoading &&
      (!selectedQuote ||
        (selectedQuote &&
          priceImpact &&
          Math.abs(getPriceImpactPercentage(priceImpact) || 0) >
            NOT_BLOCKING_PRICE_IMPACT)));

  useEffect(() => {
    if (selectedQuote && !showQuotesLoadingState) {
      trackTransactionFormed(selectedQuote);
    }
  }, [selectedQuote, showQuotesLoadingState, trackTransactionFormed]);

  const blockingWarningProps = useMemo(() => {
    return priceImpact && selectedQuote?.transactionSwap
      ? getBlockingWarningProps(priceImpact)
      : null;
  }, [priceImpact, selectedQuote]);

  const { mutate: sendTransaction, ...sendTransactionMutation } = useMutation({
    mutationFn: async (
      interpretationAction: AddressAction | null
    ): Promise<SignTransactionResult> => {
      invariant(
        selectedForSignQuote?.transactionSwap,
        'Cannot submit transaction without a quote'
      );
      invariant(spendChain, 'Chain must be defined to sign the tx');
      invariant(network, 'Network must be defined to sign the tx');
      invariant(formState.inputAmount, 'inputAmount must be set');
      invariant(
        inputPosition && outputPosition,
        'Trade positions must be defined'
      );
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      const fallbackAddressAction = createTradeAddressAction({
        hash: null,
        address,
        explorerUrl: null,
        network,
        rate: selectedForSignQuote.rate,
        spendAsset: inputPosition.asset,
        receiveAsset: outputPosition.asset,
        spendAmount: {
          currency,
          quantity: formState.inputAmount,
          value: inputPosition.asset.price?.value
            ? new BigNumber(formState.inputAmount)
                .multipliedBy(inputPosition.asset.price.value)
                .toNumber()
            : null,
          usdValue: inputFungibleUsdInfoForAnalytics?.data?.fungible.meta.price
            ? new BigNumber(formState.inputAmount)
                .multipliedBy(
                  inputFungibleUsdInfoForAnalytics.data.fungible.meta.price
                )
                .toNumber()
            : null,
        },
        receiveAmount: selectedForSignQuote.outputAmount,
        transaction: toMultichainTransaction(
          selectedForSignQuote.transactionSwap
        ),
      });

      const txResponse = await sendTxBtnRef.current.sendTransaction({
        transaction: toMultichainTransaction(
          selectedForSignQuote.transactionSwap
        ),
        chain: spendChain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Swap',
        feeValueCommon:
          selectedForSignQuote.networkFee?.amount?.quantity || '0',
        addressAction: interpretationAction ?? fallbackAddressAction,
        quote: selectedForSignQuote,
        outputChain: inputChain ?? null,
        warningWasShown: Boolean(showPriceImpactCallout),
        outputAmountColor: showPriceImpactWarning ? 'red' : 'grey',
      });
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

  const gasbackValueRef = useRef<number | null>(null);
  const handleGasbackReady = useCallback((value: number) => {
    gasbackValueRef.current = value;
  }, []);

  const navigate = useNavigate();
  const { isUK } = useUKDetection();

  if (sendTransactionMutation.isSuccess) {
    const result = sendTransactionMutation.data;
    invariant(
      inputPosition && outputPosition && result,
      'Missing Form State View values'
    );
    invariant(
      snapshotRef.current,
      'State snapshot must be taken before submit'
    );
    return (
      <SuccessState
        hash={result.evm?.hash ?? ensureSolanaResult(result).signature}
        inputPosition={inputPosition}
        outputPosition={outputPosition}
        swapFormState={snapshotRef.current.state}
        gasbackValue={gasbackValueRef.current}
        onDone={() => {
          sendTransactionMutation.reset();
          snapshotRef.current = null;
          gasbackValueRef.current = null;
          navigate('/overview/history');
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
                borderRadius={6}
              />
            </UnstyledLink>
          </HStack>
        }
      />
      <BottomSheetDialog
        ref={slippageDialogRef}
        height="360px"
        containerStyle={{ display: 'flex', flexDirection: 'column' }}
        renderWhenOpen={() => {
          invariant(spendChain, 'Chain must be defined');
          return (
            <>
              <DialogTitle
                alignTitle="start"
                closeKind="icon"
                title={<UIText kind="headline/h3">Slippage</UIText>}
              />
              <Spacer height={24} />
              <SlippageSettings
                chain={spendChain}
                configuration={toConfiguration(formState)}
                onConfigurationChange={(value) => {
                  const partial = fromConfiguration(value);
                  setUserFormState((state) => ({ ...state, ...partial }));
                  slippageDialogRef.current?.close();
                }}
              />
            </>
          );
        }}
      />
      <BottomSheetDialog
        ref={blockingWarningDialogRef}
        height="min-content"
        containerStyle={{ display: 'flex', flexDirection: 'column' }}
        renderWhenOpen={() => {
          invariant(
            blockingWarningProps,
            'Blocking warning props must be defined'
          );
          return <BlockingWarningOverlay {...blockingWarningProps} />;
        }}
      />
      <BottomSheetDialog
        ref={confirmDialogRef}
        key={selectedForSignQuote?.transactionApprove ? 'approve' : 'swap'}
        height="min-content"
        displayGrid={true}
        style={{ minHeight: innerHeight >= 750 ? '70vh' : '90vh' }}
        containerStyle={{ display: 'flex', flexDirection: 'column' }}
        renderWhenOpen={() => {
          invariant(
            selectedForSignTransaction,
            'Tx must be defined to confirm'
          );
          invariant(wallet, 'Current wallet not found');
          invariant(spendChain, 'Chain must be defined');

          return (
            <ViewLoadingSuspense>
              <TransactionConfirmationView
                title={
                  selectedForSignQuote?.transactionApprove ? 'Approve' : 'Trade'
                }
                wallet={wallet}
                chain={spendChain}
                transaction={toMultichainTransaction(
                  selectedForSignTransaction
                )}
                configuration={toConfiguration(formState)}
                customAllowanceValueBase={allowanceBase || undefined}
                onOpenAllowanceForm={
                  selectedForSignTransaction.evm?.customData?.paymasterParams // support editing allowance only for non-paymaster transactions
                    ? undefined
                    : () => allowanceDialogRef.current?.showModal()
                }
                paymasterEligible={Boolean(
                  selectedForSignTransaction.evm?.customData?.paymasterParams
                )}
                paymasterPossible={Boolean(
                  network?.supports_sponsored_transactions
                )}
                eligibilityQuery={{
                  isError: false,
                  status: 'success',
                  data: {
                    data: {
                      eligible: Boolean(
                        selectedForSignTransaction.evm?.customData
                          ?.paymasterParams
                      ),
                    },
                  },
                }}
                onGasbackReady={handleGasbackReady}
              />
            </ViewLoadingSuspense>
          );
        }}
      />

      <BottomSheetDialog
        ref={allowanceDialogRef}
        height="min-content"
        renderWhenOpen={() => {
          invariant(spendChain, 'Chain must be defined');
          invariant(inputAmount, 'inputAmount must be defined');
          invariant(
            inputPosition?.asset,
            'Spend position asset must be defined'
          );
          invariant(
            inputPosition?.quantity,
            'Spend position quantity must be defined'
          );

          const asset = inputPosition.asset;
          const decimals = getDecimals({ asset, chain: spendChain });
          const spendAmountBase = commonToBase(inputAmount, decimals);
          const value = allowanceBase
            ? new BigNumber(allowanceBase)
            : spendAmountBase;
          const positionBalanceCommon = getPositionBalance(inputPosition);
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
                    asset={inputPosition.asset}
                    chain={spendChain}
                    address={address}
                    balance={positionBalanceCommon}
                    requestedAllowanceQuantityBase={spendAmountBase}
                    value={value}
                    onSubmit={(quantity) => {
                      setAllowanceBase(quantity);
                      allowanceDialogRef.current?.close();
                    }}
                    addressAction={null}
                  />
                </div>
              </>
            </ViewLoadingSuspense>
          );
        }}
      />

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();

          if (event.currentTarget.checkValidity()) {
            invariant(
              blockingWarningDialogRef.current,
              'Blocking warning dialog not found'
            );
            setSelectedForSignQuote(selectedQuote);
            const formData = new FormData(event.currentTarget);
            const submitType = formData.get('submit_type');
            const promise = blockingWarningProps
              ? showConfirmDialog(blockingWarningDialogRef.current)
              : Promise.resolve();
            promise.then(() => {
              invariant(
                confirmDialogRef.current,
                'Confirmation dialog not found'
              );
              return showConfirmDialog(confirmDialogRef.current).then(
                (rawInterpretationAction) => {
                  const interpretationAction =
                    rawInterpretationAction !== 'confirm'
                      ? (JSON.parse(rawInterpretationAction) as AddressAction)
                      : null;

                  if (submitType === 'approve') {
                    sendApproveTransaction(interpretationAction);
                  } else if (submitType === 'swap') {
                    sendTransaction(interpretationAction);
                  } else {
                    throw new Error('Must set a submit_type to form');
                  }
                }
              );
            });
          }
        }}
      >
        <VStack gap={16}>
          <NetworkSelect
            standard={getAddressType(address)}
            showEcosystemHint={true}
            value={formState.inputChain ?? ''}
            onChange={(value) => {
              handleChange('inputChain', value);
            }}
            dialogRootNode={rootNode}
            filterPredicate={(network) => network.supports_trading}
          />
          <VStack gap={4} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <div className={styles.arcParent}>
                <SpendTokenField
                  formState={formState}
                  onChange={handleAssetChange}
                  outputAmount={outputAmount}
                  positions={availablePositions}
                  spendPosition={inputPosition}
                  spendNetwork={network}
                  receivePosition={outputPosition}
                />
                <BottomArc />
              </div>
              <ReverseButton
                onClick={() =>
                  setUserFormState((state) => ({
                    ...state,
                    ...reverseTokens(formState),
                  }))
                }
              />
            </div>
            <div className={styles.arcParent}>
              <TopArc />
              <ReceiveTokenField
                formState={formState}
                onChange={handleAssetChange}
                outputAmount={outputAmount}
                positions={availablePositions}
                spendPosition={inputPosition}
                receivePosition={outputPosition}
                priceImpact={priceImpact}
                showPriceImpactWarning={showPriceImpactWarning}
                readOnly={true}
              />
            </div>
          </VStack>
        </VStack>
      </form>
      <Spacer height={16} />
      <VStack gap={8}>
        <VStack
          gap={8}
          style={
            selectedQuote || quotesData.isLoading || quotesData.error
              ? {
                  borderRadius: 12,
                  border: '2px solid var(--neutral-200)',
                  padding: '12px 16px',
                }
              : undefined
          }
        >
          {inputChainAddressMismatch ? (
            <UIText kind="small/regular" color="var(--notice-600)">
              {getAddressType(address) === 'evm'
                ? 'Please switch to an Ethereum network'
                : 'Please switch to a Solana network'}
            </UIText>
          ) : null}
          <RateLine
            quotesData={quotesData}
            selectedQuote={selectedQuote}
            onQuoteIdChange={setUserQuoteId}
          />
          {spendChain ? (
            <SlippageLine
              formState={formState}
              receiveAsset={outputPosition?.asset ?? null}
              chain={spendChain}
              outputAmount={selectedQuote?.outputAmount.quantity ?? null}
            />
          ) : null}
          {isEthereumAddress(address) &&
          currentTransaction?.evm &&
          spendChain ? (
            <React.Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'end' }}>
                  <CircleSpinner />
                </div>
              }
            >
              <TransactionConfiguration
                keepPreviousData={true}
                transaction={toIncomingTransaction(currentTransaction.evm)}
                from={address}
                chain={spendChain}
                paymasterEligible={Boolean(
                  currentTransaction.evm.customData?.paymasterParams
                )}
                paymasterPossible={Boolean(
                  network?.supports_sponsored_transactions
                )}
                paymasterWaiting={false}
                onFeeValueCommonReady={null}
                configuration={toConfiguration(formState)}
                onConfigurationChange={(value) => {
                  const partial = fromConfiguration(value);
                  setUserFormState((state) => ({ ...state, ...partial }));
                }}
                gasback={gasbackEstimation}
              />
            </React.Suspense>
          ) : null}

          {isSolanaAddress(address) && selectedQuote?.networkFee ? (
            <NetworkFeeLineInfo
              networkFee={selectedQuote.networkFee}
              isLoading={quotesData.isPreviousData}
            />
          ) : null}
          {selectedQuote?.protocolFee.percentage === 0 ? (
            <HStack gap={8} justifyContent="space-between">
              <UIText kind="small/regular">Zerion Fee</UIText>
              <UIText kind="small/accent" className={styles.gradientText}>
                Free
              </UIText>
            </HStack>
          ) : null}
        </VStack>
        {isUK ? <UKDisclaimer style={{ marginBottom: 8 }} /> : null}
        <PremiumFormBanner address={address} style={{ marginBottom: 8 }} />
        {selectedQuote?.error?.message ? (
          <TransactionWarning
            title="Warning"
            message={selectedQuote?.error?.message}
            style={{ marginBottom: 8 }}
          />
        ) : null}
        {showPriceImpactCallout ? (
          <PriceImpactLine
            priceImpact={priceImpact}
            style={{ marginBottom: 8 }}
          />
        ) : null}
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
          <HStack gap={12} alignItems="center" style={{ paddingTop: 16 }}>
            <ApproveHintLine
              // or {approveTxStatus === 'confirmed'} ?
              approved={Boolean(selectedQuote?.transactionSwap)}
              actionName="Swap"
            />
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
            <VStack
              gap={8}
              style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 12 }}
            >
              {approveMutation.isError ? (
                <ErrorMessage
                  error={getError(approveMutation.error)}
                  hardwareError={getHardwareError(approveMutation.error)}
                />
              ) : null}
              {wallet && globalPreferences ? (
                <SignTransactionButton
                  ref={approveTxBtnRef}
                  form={formId}
                  wallet={wallet}
                  disabled={
                    showQuotesLoadingState ||
                    approveMutation.isLoading ||
                    approveTxStatus === 'pending'
                  }
                  holdToSign={false}
                  bluetoothSupportEnabled={
                    globalPreferences.bluetoothSupportEnabled
                  }
                >
                  {approveMutation.isLoading || approveTxStatus === 'pending'
                    ? 'Approving...'
                    : showQuotesLoadingState
                    ? 'Fetching offers'
                    : `Approve ${inputPosition?.asset.symbol ?? null}`}
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
            <VStack
              gap={8}
              style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 12 }}
            >
              {sendTransactionMutation.isError ? (
                <ErrorMessage
                  error={getError(sendTransactionMutation.error)}
                  hardwareError={getHardwareError(
                    sendTransactionMutation.error
                  )}
                />
              ) : null}
              {wallet && globalPreferences ? (
                <FormHint
                  quotesData={quotesData}
                  priceImpact={priceImpact}
                  formState={formState}
                  selectedQuote={selectedQuote}
                  inputPosition={inputPosition}
                  render={(hint) => (
                    <SignTransactionButton
                      ref={sendTxBtnRef}
                      form={formId}
                      wallet={wallet}
                      style={{ marginTop: 'auto' }}
                      disabled={
                        sendTransactionMutation.isLoading ||
                        showQuotesLoadingState ||
                        Boolean(
                          (selectedQuote && !selectedQuote.transactionSwap) ||
                            quotesData.error
                        )
                      }
                      holdToSign={false}
                      bluetoothSupportEnabled={
                        globalPreferences.bluetoothSupportEnabled
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
                          (showQuotesLoadingState
                            ? 'Fetching offers'
                            : sendTransactionMutation.isLoading
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

/** Sets initial chainInput to last used chain for current address */
function SwapFormPrepareChain({ children }: React.PropsWithChildren) {
  const { singleAddress: address, ready } = useAddressParams();
  const navigationType = useNavigationType();
  const isBackOrForward = navigationType === 'POP';
  const [searchParams, setSearchParams] = useSearchParams();
  const [prepared, setPrepared] = useState(
    isBackOrForward || searchParams.has('chainInput')
  );
  const { data: lastUsedChain, isFetchedAfterMount } = useQuery({
    enabled: ready && !prepared,
    // Avoid using stale value. Leaving form and coming back should use new value instantly
    staleTime: 0,
    queryKey: ['wallet/getLastSwapChainByAddress', address],
    queryFn: () => walletPort.request('getLastSwapChainByAddress', { address }),
  });
  useEffect(() => {
    if (prepared || !isFetchedAfterMount) {
      return;
    }
    if (lastUsedChain) {
      searchParams.set('chainInput', lastUsedChain);
      setSearchParams(searchParams, { replace: true });
    }
    setPrepared(true);
  }, [
    isFetchedAfterMount,
    lastUsedChain,
    prepared,
    searchParams,
    setSearchParams,
  ]);
  return prepared ? children : null;
}

export function SwapForm() {
  const { preferences } = usePreferences();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" />;
  }
  return (
    <>
      <SwapFormPrepareChain>
        <SwapFormComponent />
      </SwapFormPrepareChain>
    </>
  );
}
