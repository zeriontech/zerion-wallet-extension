import { useMutation, useQuery } from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import {
  useNetworkConfig,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import {
  queryHttpAddressPositions,
  useHttpAddressPositions,
} from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
import WarningIcon from 'jsx:src/ui/assets/warning.svg';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { getDecimals } from 'src/modules/networks/asset';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { AddressPosition } from 'defi-sdk';
import {
  SignTransactionButton,
  type SendTxBtnHandle,
} from 'src/ui/components/SignTransactionButton';
import { useEvent } from 'src/ui/shared/useEvent';
import { invariant } from 'src/shared/invariant';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  createApproveAddressAction,
  createBridgeAddressAction,
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
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { AnimatedAppear } from 'src/ui/components/AnimatedAppear';
import { isNumeric } from 'src/shared/isNumeric';
import { PageBottom } from 'src/ui/components/PageBottom';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { useGasbackEstimation } from 'src/modules/ethereum/account-abstraction/rewards';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { useQuotes2 } from 'src/ui/shared/requests/useQuotes';
import type { Quote2 } from 'src/shared/types/Quote';
import {
  toIncomingTransaction,
  toMultichainTransaction,
} from 'src/shared/types/Quote';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { getDefaultChain } from 'src/ui/shared/forms/trading/getDefaultChain';
import { getHttpClientSource } from 'src/modules/zerion-api/getHttpClientSource';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { sortPositionsByValue } from 'src/ui/components/Positions/groupPositions';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { Networks } from 'src/modules/networks/Networks';
import { modifyApproveAmount } from 'src/modules/ethereum/transactions/appovals';
import { commonToBase } from 'src/shared/units/convert';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { ensureSolanaResult } from 'src/modules/shared/transactions/helpers';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { useUKDetection } from 'src/ui/components/UKDisclaimer/useUKDetection';
import { UKDisclaimer } from 'src/ui/components/UKDisclaimer/UKDisclaimer';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { TransactionConfiguration } from '../SendTransaction/TransactionConfiguration';
import { ApproveHintLine } from '../SwapForm/ApproveHintLine';
import { getQuotesErrorMessage } from '../SwapForm/Quotes/getQuotesErrorMessage';
import { getPopularTokens } from '../SwapForm/shared/getPopularTokens';
import { usePosition } from '../SwapForm/shared/usePosition';
import { fromConfiguration, toConfiguration } from '../SendForm/shared/helpers';
import { NetworkFeeLineInfo } from '../SendTransaction/TransactionConfiguration/TransactionConfiguration';
import type { PopoverToastHandle } from '../Settings/PopoverToast';
import { PopoverToast } from '../Settings/PopoverToast';
import { PriceImpactLine } from '../SwapForm/shared/PriceImpactLine';
import type { PriceImpact } from '../SwapForm/shared/price-impact';
import {
  calculatePriceImpact,
  getPriceImpactPercentage,
  NOT_BLOCKING_PRICE_IMPACT,
} from '../SwapForm/shared/price-impact';
import { TransactionWarning } from '../SendTransaction/TransactionWarnings/TransactionWarning';
import { getSlippageOptions } from '../SwapForm/SlippageSettings/getSlippageOptions';
import {
  BlockingWarningOverlay,
  getBlockingWarningProps,
} from '../SwapForm/shared/BlockingWarningOverlay';
import type { BridgeFormState } from './types';
import { ReverseButton } from './ReverseButton';
import { SpendTokenField } from './fieldsets/SpendTokenField';
import { ReceiveTokenField } from './fieldsets/ReceiveTokenField';
import { SuccessState } from './SuccessState';
import { LabeledNetworkSelect } from './LabeledNetworkSelect';
import { BridgeLine } from './BridgeLine';
import { ZerionFeeLine } from './ZerionFeeLine';
import { ReceiverAddressField } from './ReceiverAddressField';

const rootNode = getRootDomNode();

function FormHint({
  formState,
  inputPosition,
  quotesData,
  render,
  inputNetwork,
  inputChainAddressMatch,
  outputChainAddressMatch,
  priceImpact,
  selectedQuote,
}: {
  formState: BridgeFormState;
  inputPosition: AddressPosition | EmptyAddressPosition | null;
  quotesData: QuotesData<Quote2>;
  render: (message: React.ReactNode | null) => React.ReactNode;
  inputNetwork?: NetworkConfig | null;
  inputChainAddressMatch: boolean;
  outputChainAddressMatch: boolean;
  priceImpact: PriceImpact | null;
  selectedQuote: Quote2 | null;
}) {
  const value = formState.inputAmount;
  const invalidValue = value && !isNumeric(value);
  const valueMissing = !value || Number(value) === 0;

  const positionBalanceCommon = inputPosition
    ? getPositionBalance(inputPosition)
    : null;
  const exceedsBalance = Number(value) > Number(positionBalanceCommon);

  const showPriceImpactWarning =
    selectedQuote?.transactionSwap &&
    !quotesData.isLoading &&
    (priceImpact?.kind === 'n/a' ||
      (priceImpact?.kind === 'loss' &&
        (priceImpact.level === 'medium' || priceImpact.level === 'high')));

  let message: React.ReactNode | null = null;
  if (exceedsBalance) {
    message = 'Insufficient balance';
  } else if (valueMissing) {
    message = 'Enter amount';
  } else if (invalidValue) {
    message = 'Incorrect amount';
  } else if (quotesData.error) {
    message = getQuotesErrorMessage(quotesData);
  } else if (!outputChainAddressMatch) {
    message = formState.to ? '' : 'Add Recipient Address';
  } else if (!inputChainAddressMatch) {
    message = !inputNetwork
      ? 'Loading networks...'
      : Networks.getEcosystem(inputNetwork) === 'solana'
      ? 'Please switch to an Ethereum "From" network'
      : 'Please switch to a Solana "From" network';
  } else if (showPriceImpactWarning) {
    message = (
      <HStack gap={8} alignItems="center" justifyContent="center">
        <WarningIcon
          style={{ width: 20, height: 20 }}
          color="var(--negative-500)"
        />
        <UIText kind="small/accent">Bridge Anyway</UIText>
      </HStack>
    );
  }
  return render(message);
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
    return position.type === 'asset' && network?.supports_bridging;
  });
  return filteredPositions;
}

function getDefaultState({
  address,
  positions,
}: {
  address: string;
  positions: AddressPosition[] | null;
}) {
  const inputChain = getDefaultChain(address, positions ?? []);
  return {
    inputChain,
    outputChain:
      inputChain === NetworkId.Solana ? NetworkId.Ethereum : NetworkId.Solana,
    sort: '1' as const,
  };
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
const EMPTY_DEFAULT_STATE: BridgeFormState = {
  inputChain: undefined,
  outputChain: undefined,
  inputFungibleId: undefined,
  outputFungibleId: undefined,
  showReceiverAddressInput: 'off',
  sort: '1' as const,
};

async function prepareDefaultState({
  address,
  userStateInputChain,
  userStateOutputChain,
  currency,
}: {
  address: string;
  userStateInputChain: string | null;
  userStateOutputChain: string | null;
  currency: string;
}): Promise<BridgeFormState> {
  const source = await getHttpClientSource();
  const { data: allPositions } = await queryHttpAddressPositions(
    { addresses: [address], currency },
    { source }
  );
  const networksStore = await getNetworksStore();
  const positionsOnSupportedChains =
    await filterSupportedPositionsOnSupportedChains(allPositions);
  const { inputChain: defaultInputChain, outputChain: defaultOutputChain } =
    getDefaultState({
      address,
      positions: positionsOnSupportedChains,
    });
  const inputChain = userStateInputChain ?? defaultInputChain ?? NetworkId.Zero;
  const outputChain =
    userStateOutputChain ?? defaultOutputChain ?? NetworkId.Ethereum;
  const [inputNetwork, outputNetwork, popularOutputChainTokens] =
    await Promise.all([
      networksStore.fetchNetworkById(inputChain),
      networksStore.fetchNetworkById(outputChain),
      queryPopularTokens(createChain(inputChain)).catch(() => []),
    ]);

  const positions = allPositions
    .filter((position) => position.chain === inputChain)
    .filter((p) => p.type === 'asset');

  const sorted = sortPositionsByValue(positions);
  const inputNativeAssetId = inputNetwork.native_asset?.id;
  const defaultInputFungibleId = sorted.at(0)?.asset.id || inputNativeAssetId;

  const USDC_BACKEND_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const outputNativeAssetId = outputNetwork.native_asset?.id;
  const defaultOutputFungibleId = outputNativeAssetId
    ? outputNativeAssetId
    : popularOutputChainTokens.at(0) ?? USDC_BACKEND_ID;

  return {
    inputChain,
    outputChain,
    inputFungibleId: defaultInputFungibleId,
    outputFungibleId: defaultOutputFungibleId,
  };
}

type HandleChangeFunction = <K extends keyof BridgeFormState>(
  key: K,
  value: BridgeFormState[K]
) => void;

function reverseChains(state: BridgeFormState, outputAmount?: string) {
  const { inputChain, outputChain, inputFungibleId, outputFungibleId } = state;
  const newState: BridgeFormState = {};
  if (inputChain) {
    newState.outputChain = inputChain;
  }
  if (outputChain) {
    newState.inputChain = outputChain;
  }
  if (inputFungibleId) {
    newState.outputFungibleId = inputFungibleId;
  }
  if (outputFungibleId) {
    newState.inputFungibleId = outputFungibleId;
  }
  if (outputAmount) {
    newState.inputAmount = outputAmount;
  }
  return newState;
}

function changeChain<K extends keyof BridgeFormState>(
  state: BridgeFormState,
  key: K,
  value: BridgeFormState[K],
  outputAmount?: string
) {
  const isSameAsOpposite =
    (key === 'inputChain' && value === state.outputChain) ||
    (key === 'outputChain' && value === state.inputChain);

  if (isSameAsOpposite) {
    const newState = reverseChains(state, outputAmount);
    newState[key] = value;
    return newState;
  } else {
    return { [key]: value };
  }
}

function BridgeNetworksSelect({
  address,
  sourceChain,
  destinationChain,
  onChangeSourceChain,
  onChangeDestinationChain,
  onReverseChains,
  filterSourceChainPredicate,
  filterDestinationChainPredicate,
}: {
  address: string;
  sourceChain: string;
  destinationChain: string;
  onChangeSourceChain: (value: string) => void;
  onChangeDestinationChain: (value: string) => void;
  onReverseChains: () => void;
  filterSourceChainPredicate?: (network: NetworkConfig) => boolean;
  filterDestinationChainPredicate?: (network: NetworkConfig) => boolean;
}) {
  const { networks } = useNetworks();
  const supportsBridging = useCallback(
    (network: NetworkConfig) =>
      networks?.supports('bridging', createChain(network.id)) || false,
    [networks]
  );

  return (
    <HStack
      gap={8}
      alignItems="center"
      style={{ gridTemplateColumns: '1fr 32px 1fr' }}
    >
      <LabeledNetworkSelect
        standart={getAddressType(address)}
        label="From"
        value={sourceChain}
        onChange={(value) => {
          if (value === destinationChain) {
            onReverseChains();
          } else {
            onChangeSourceChain(value);
          }
        }}
        dialogRootNode={rootNode}
        filterPredicate={(network) =>
          supportsBridging(network) &&
          (filterSourceChainPredicate?.(network) ?? true)
        }
      />
      <ReverseButton onClick={onReverseChains} />
      <LabeledNetworkSelect
        standart="all"
        label="To"
        value={destinationChain}
        onChange={(value) => {
          if (value === sourceChain) {
            onReverseChains();
          } else {
            onChangeDestinationChain(value);
          }
        }}
        dialogRootNode={rootNode}
        filterPredicate={(network) =>
          supportsBridging(network) &&
          (filterDestinationChainPredicate?.(network) ?? true)
        }
      />
    </HStack>
  );
}

function NativeZeroBridgeHint() {
  return (
    <VStack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid var(--notice-500)',
      }}
    >
      <UIText kind="small/regular" color="var(--notice-500)">
        It seems there is a lack of liquidity, if you are not in a hurry and
        want a better quote, use:
      </UIText>
      <UIText kind="small/accent" color="var(--primary)">
        <TextAnchor
          href="https://bridge.zero.network/bridge/withdraw"
          target="_blank"
          rel="noopener noreferrer"
        >
          bridge.zero.network
        </TextAnchor>
      </UIText>
    </VStack>
  );
}

function BridgeFormComponent() {
  useBackgroundKind(whiteBackgroundKind);
  const { globalPreferences } = useGlobalPreferences();

  const toastRef = useRef<PopoverToastHandle>(null);
  const { singleAddress: address, singleAddressNormalized } =
    useAddressParams();
  const { currency } = useCurrency();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const [userFormState, setUserFormState] =
    useSearchParamsObj<BridgeFormState>();

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

  const defaultFormValues = useMemo<BridgeFormState>(
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
        userFormState.outputChain,
      ],
      queryFn: async () => {
        const result = await prepareDefaultState({
          address: singleAddressNormalized,
          currency,
          userStateInputChain: userFormState.inputChain ?? null,
          userStateOutputChain: userFormState.outputChain ?? null,
        });
        return result;
      },
      staleTime: Infinity,
      suspense: false,
      keepPreviousData: true,
    });

  const formState: BridgeFormState = useMemo(
    () => ({ ...defaultState, ...preState }),
    [defaultState, preState]
  );

  const handleChange = useCallback<HandleChangeFunction>(
    (key, value) => setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const {
    inputAmount,
    inputFungibleId,
    inputChain,
    outputChain,
    outputFungibleId,
    to,
    receiverAddressInput,
    showReceiverAddressInput,
    sort,
  } = formState;

  const availableSpendPositions = useMemo(() => {
    const positions = allPositions
      ?.filter((p) => p.chain === inputChain)
      .filter((p) => p.type === 'asset');
    return sortPositionsByValue(positions);
  }, [allPositions, inputChain]);

  const availableReceivePositions = useMemo(() => {
    const positions = allPositions
      ?.filter((p) => p.chain === outputChain)
      .filter((p) => p.type === 'asset');
    return sortPositionsByValue(positions);
  }, [allPositions, outputChain]);

  const spendChain = inputChain ? createChain(inputChain) : null;
  const receiveChain = outputChain ? createChain(outputChain) : null;
  const { data: inputNetwork } = useNetworkConfig(inputChain ?? null);
  const { data: outputNetwork } = useNetworkConfig(outputChain ?? null);

  const inputPosition = usePosition({
    assetId: inputFungibleId ?? null,
    positions: allPositions,
    chain: spendChain,
  });
  const outputPosition = usePosition({
    assetId: outputFungibleId ?? null,
    positions: allPositions,
    chain: receiveChain,
  });

  const allowanceDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const blockingWarningDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  const sendTxBtnRef = useRef<SendTxBtnHandle | null>(null);
  const approveTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const formId = useId();

  const inputChainAddressMatch = Boolean(
    inputNetwork &&
      isMatchForEcosystem(address, Networks.getEcosystem(inputNetwork))
  );

  const bridgeInsideEcosystem =
    inputNetwork &&
    outputNetwork &&
    Networks.getEcosystem(inputNetwork) ===
      Networks.getEcosystem(outputNetwork);

  const outputChainAddressMatch = Boolean(
    bridgeInsideEcosystem
      ? isMatchForEcosystem(to ?? address, Networks.getEcosystem(outputNetwork))
      : to &&
          outputNetwork &&
          isMatchForEcosystem(to, Networks.getEcosystem(outputNetwork))
  );

  const { pathname } = useLocation();

  const quotesData = useQuotes2({
    address: singleAddressNormalized,
    currency,
    formState,
    enabled:
      defaultStateQuery.isFetched &&
      !defaultStateQuery.isPreviousData &&
      inputChainAddressMatch &&
      outputChainAddressMatch,
    context: 'Bridge',
    pathname,
  });

  const { refetch: refetchQuotes } = quotesData;

  const [userQuoteId, setUserQuoteId] = useState<string | null>(null);
  useEffect(() => {
    setUserQuoteId(null);
  }, [
    inputAmount,
    inputFungibleId,
    outputFungibleId,
    inputChain,
    outputChain,
    sort,
  ]);

  const selectedQuote = useMemo(() => {
    const userQuote = quotesData.quotes?.find(
      (quote) => quote.contractMetadata?.id === userQuoteId
    );
    const defaultQuote = quotesData.quotes?.[0];
    return userQuote || defaultQuote || null;
  }, [userQuoteId, quotesData.quotes]);

  const handleQuoteErrorEvent = useEvent((message: string, quote: Quote2) => {
    if (
      !inputFungibleId ||
      !outputFungibleId ||
      !inputAmount ||
      !inputChain ||
      !outputChain
    ) {
      return;
    }
    walletPort.request('quoteError', {
      message,
      backendMessage: message,
      context: 'Bridge',
      actionType: 'Send',
      type: 'Bridge form error',
      address,
      inputFungibleId,
      outputFungibleId,
      inputAmount,
      inputChain,
      outputAmount: quote.outputAmount.quantity || null,
      outputChain,
      contractType: quote.contractMetadata?.name || null,
      pathname,
      slippage: getSlippageOptions({
        chain: createChain(inputChain),
        userSlippage: null,
      }).slippagePercent,
    });
  });

  useEffect(() => {
    const errorMessage = selectedQuote?.error?.message;
    if (errorMessage && quotesData.done) {
      handleQuoteErrorEvent(errorMessage, selectedQuote);
    }
  }, [selectedQuote, quotesData.done, handleQuoteErrorEvent]);

  const outputAmount = selectedQuote?.outputAmount.quantity || null;

  const priceImpact = useMemo(() => {
    return calculatePriceImpact({
      inputValue: inputAmount || null,
      outputValue: outputAmount || null,
      inputAsset: inputPosition?.asset ?? null,
      outputAsset: outputPosition?.asset ?? null,
    });
  }, [inputAmount, inputPosition?.asset, outputAmount, outputPosition?.asset]);

  /** Same as handleChange, but reverses chains if selected chain is same as the opposite one */
  const handleChainChange = useEvent<HandleChangeFunction>((key, value) => {
    setUserFormState((state) => ({
      ...state,
      ...changeChain(formState, key, value, outputAmount ?? undefined),
    }));
  });

  const { data: gasbackEstimation } = useGasbackEstimation({
    paymasterEligible: Boolean(
      selectedQuote?.transactionSwap?.evm?.customData?.paymasterParams
    ),
    suppportsSimulations: inputNetwork?.supports_simulations ?? false,
    supportsSponsoredTransactions:
      inputNetwork?.supports_sponsored_transactions,
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

  useEffect(
    () => setAllowanceBase(null),
    [inputChain, inputAmount, inputFungibleId]
  );

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

      invariant(inputNetwork, 'Network must be defined to sign the tx');
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
            network: inputNetwork,
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

  const snapshotRef = useRef<BridgeFormState | null>(null);
  const onBeforeSubmit = () => {
    snapshotRef.current = formState;
  };

  const showPriceImpactCallout =
    quotesData.done &&
    !isApproveMode &&
    (priceImpact?.kind === 'n/a' ||
      (priceImpact?.kind === 'loss' && priceImpact.level === 'high'));

  const showPriceImpactWarning =
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const trackTransactionFormed = useEvent((quote: Quote2) => {
    walletPort.request('transactionFormed', {
      formState,
      quote,
      scope: 'Bridge',
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
      invariant(inputNetwork, 'Network must be defined to sign the tx');
      invariant(outputNetwork, 'Output network must be defined to sign the tx');
      invariant(formState.inputAmount, 'inputAmount must be set');
      invariant(
        inputPosition && outputPosition,
        'Trade positions must be defined'
      );
      invariant(sendTxBtnRef.current, 'SignTransactionButton not found');
      const fallbackAddressAction = createBridgeAddressAction({
        hash: null,
        address,
        explorerUrl: null,
        inputNetwork,
        outputNetwork,
        receiverAddress: to || null,
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
        clientScope: 'Bridge',
        feeValueCommon:
          selectedForSignQuote.networkFee?.amount?.quantity || '0',
        addressAction: interpretationAction ?? fallbackAddressAction,
        quote: selectedForSignQuote,
        outputChain: outputChain ?? null,
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

  const formRef = useRef<HTMLFormElement | null>(null);
  const { innerHeight } = useWindowSizeStore();

  const outputEcosystem = outputNetwork && Networks.getEcosystem(outputNetwork);
  const addressFilterPredicate = useCallback(
    (value: string) => {
      return !outputEcosystem || isMatchForEcosystem(value, outputEcosystem);
    },
    [outputEcosystem]
  );

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
        explorer={selectedQuote?.contractMetadata?.explorer ?? null}
        inputPosition={inputPosition}
        outputPosition={outputPosition}
        formState={snapshotRef.current}
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

  /**
   * Show native zero bridge hint when: there is low liquidity or no liquidity at all
   */
  const showNativeZeroBridgeHint =
    inputChain === NetworkId.Zero &&
    (quotesData.done || quotesData.error) &&
    (!selectedQuote || showPriceImpactWarning);

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
              borderRadius={6}
            />
          </UnstyledLink>
        }
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
            'Transaction must be defined to confirm'
          );
          invariant(wallet, 'Current wallet not found');
          invariant(spendChain, 'Spend chain must be defined');
          return (
            <ViewLoadingSuspense>
              <TransactionConfirmationView
                title={
                  selectedForSignQuote?.transactionApprove
                    ? 'Approve'
                    : 'Bridge'
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
                  inputNetwork?.supports_sponsored_transactions
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
          invariant(spendChain, 'Spend chain must be defined');
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
        ref={formRef}
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
              showConfirmDialog(confirmDialogRef.current).then(
                (rawInterpretationAction) => {
                  const interpretationAction =
                    rawInterpretationAction !== 'confirm'
                      ? (JSON.parse(rawInterpretationAction) as AddressAction)
                      : null;
                  if (submitType === 'approve') {
                    sendApproveTransaction(interpretationAction);
                  } else if (submitType === 'bridge') {
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
          <PopoverToast
            ref={toastRef}
            style={{
              bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
            }}
          >
            <div style={{ maxWidth: 300, textAlign: 'center' }}>
              {getAddressType(address) === 'solana'
                ? 'Switch to your Ethereum wallet to bridge from Ethereum Ecosystem.'
                : 'Switch to your Solana wallet to bridge from Solana Ecosystem.'}
            </div>
          </PopoverToast>
          <BridgeNetworksSelect
            address={address}
            sourceChain={inputChain ?? ''}
            destinationChain={outputChain ?? ''}
            filterSourceChainPredicate={(network: NetworkConfig) =>
              isMatchForEcosystem(address, Networks.getEcosystem(network))
            }
            onChangeSourceChain={(value) =>
              handleChainChange('inputChain', value)
            }
            onChangeDestinationChain={(value) =>
              handleChainChange('outputChain', value)
            }
            onReverseChains={() =>
              bridgeInsideEcosystem
                ? setUserFormState((state) => ({
                    ...state,
                    ...reverseChains(formState),
                  }))
                : toastRef.current?.showToast()
            }
          />
          <VStack gap={4}>
            <SpendTokenField
              spendInput={inputAmount}
              spendPosition={inputPosition}
              spendNetwork={inputNetwork}
              availableSpendPositions={availableSpendPositions ?? []}
              receiveInput={outputAmount ?? undefined}
              receiveAsset={outputPosition?.asset ?? null}
              onChangeAmount={(value) => handleChange('inputAmount', value)}
              onChangeToken={(value) => handleChange('inputFungibleId', value)}
            />
            <ReceiveTokenField
              receiveInput={outputAmount ?? undefined}
              receiveChain={receiveChain}
              receivePosition={outputPosition}
              availableReceivePositions={availableReceivePositions ?? []}
              spendInput={inputAmount ?? undefined}
              spendAsset={inputPosition?.asset ?? null}
              onChangeToken={(value) => handleChange('outputFungibleId', value)}
              priceImpact={priceImpact}
              showPriceImpactWarning={showPriceImpactWarning}
            />
            <ReceiverAddressField
              title={
                !outputNetwork
                  ? 'Recipient Address'
                  : Networks.getEcosystem(outputNetwork) === 'evm'
                  ? 'Ethereum Recipient Address'
                  : 'Solana Recipient Address'
              }
              to={to ?? null}
              receiverAddressInput={receiverAddressInput ?? null}
              onChange={(value) =>
                handleChange('receiverAddressInput', value ?? undefined)
              }
              showAddressInput={showReceiverAddressInput === 'on'}
              onShowInputChange={(value) =>
                // Changing visibility of the input should reset the input value
                // to align with the visual language of the input
                setUserFormState((state) => ({
                  ...state,
                  showReceiverAddressInput: value ? 'on' : 'off',
                  to: undefined,
                  receiverAddressInput: undefined,
                }))
              }
              onResolvedChange={(value) => handleChange('to', value)}
              filterAddressPredicate={addressFilterPredicate}
            />
          </VStack>
        </VStack>
      </form>

      <Spacer height={16} />
      <VStack gap={8} style={{ paddingBottom: 8 }}>
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
          <BridgeLine
            quotesData={quotesData}
            selectedQuote={selectedQuote}
            sortType={sort}
            onSortTypeChange={(value) => handleChange('sort', value)}
            onQuoteIdChange={(quoteId) => setUserQuoteId(quoteId)}
          />
          {selectedQuote ? <ZerionFeeLine quote={selectedQuote} /> : null}
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
                  inputNetwork?.supports_sponsored_transactions
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
        </VStack>
        {isUK ? <UKDisclaimer /> : null}
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
        {showNativeZeroBridgeHint ? <NativeZeroBridgeHint /> : null}
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
              actionName="Bridge"
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
            <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
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
              value="bridge"
              form={formId}
            />
            <VStack gap={8} style={{ marginTop: 'auto', textAlign: 'center' }}>
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
                  formState={formState}
                  inputPosition={inputPosition}
                  quotesData={quotesData}
                  inputNetwork={inputNetwork}
                  inputChainAddressMatch={inputChainAddressMatch}
                  outputChainAddressMatch={outputChainAddressMatch}
                  priceImpact={priceImpact}
                  selectedQuote={selectedQuote}
                  render={(hint) => (
                    <SignTransactionButton
                      ref={sendTxBtnRef}
                      form={formId}
                      wallet={wallet}
                      style={{ marginTop: 'auto' }}
                      disabled={
                        sendTransactionMutation.isLoading ||
                        showQuotesLoadingState ||
                        !inputChainAddressMatch ||
                        !outputChainAddressMatch ||
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
