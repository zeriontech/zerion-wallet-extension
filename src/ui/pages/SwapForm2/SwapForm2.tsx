import { useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '@store-unit/react';
import BigNumber from 'bignumber.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigationType } from 'react-router';
import { useLocation, useSearchParams } from 'react-router-dom';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  createApproveAddressAction2,
  createBridgeAddressAction2,
  createTradeAddressAction2,
} from 'src/modules/ethereum/transactions/addressAction/addressActionMain';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { invariant } from 'src/shared/invariant';
import {
  isReadonlyAccount,
  isDeviceAccount,
} from 'src/shared/types/validators';
import { isNumeric } from 'src/shared/isNumeric';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import { toIncomingTransaction } from 'src/shared/types/Quote';
import {
  signTransactions,
  getQueues,
  QueueAbortError,
  QueueError,
  type SignStep,
  type ToasterView,
} from 'src/ui/components/TransactionSigner';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import {
  useGlobalPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import { walletPort } from 'src/ui/shared/channels';
import { useEvent } from 'src/ui/shared/useEvent';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { PageColumn } from 'src/ui/components/PageColumn/PageColumn';
import { PageTop } from 'src/ui/components/PageTop/PageTop';
import { NavigationTitle } from 'src/ui/components/NavigationTitle/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { Button } from 'src/ui/ui-kit/Button';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { calculatePriceImpactFromPositions } from '../SwapForm/shared/price-impact';
import { getSlippageOptions } from '../SwapForm/SlippageSettings/getSlippageOptions';
import { fromConfiguration, toConfiguration } from '../SendForm/shared/helpers';
import type { PopoverToastHandle } from '../Settings/PopoverToast';
import { PopoverToast } from '../Settings/PopoverToast';
import { applyTransactionConfiguration } from './applyTransactionConfiguration';
import { useSwapQuote } from './useSwapQuote';
import { useFormState } from './useFormState';
import { useFormPositions } from './useFormPositions';
import { MiddleLine, ReverseButton } from './ReverseButton';
import { InputPosition } from './InputPosition';
import { OutputPosition } from './OutputPosition';
import { QuoteDetails } from './QuoteDetails';
import { ReceiverAddressSelector } from './ReceiverAddressSelector';
import {
  TransactionWarning,
  resolveTransactionWarning,
} from './TransactionWarning';
import { UKDisclaimer } from './UKDisclaimer';
import { USDisclaimer } from './USDisclaimer';
import { SwapButton, type SimulationResult } from './SwapButton';
import { TopUpWalletCTA } from './TopUpWalletCTA';
import { ReadonlySignButton } from './ReadonlySignButton';
import { UnverifiedWarning } from './UnverifiedWarning/UnverifiedWarning';
import { PriceImpactWarning } from './PriceImpactWarning';
import { SwapOnboardingDialog } from './SwapOnboardingDialog/SwapOnboardingDialog';
import {
  clearSwapOnboardingDevForceShow,
  swapOnboardingDevForceShowStore,
} from './SwapOnboardingDialog/devForceShowStore';
import { SwapFormError, SwapFormSkeleton } from './SwapFormSkeleton';
import { getCrossEcosystemState } from './shared/getCrossEcosystemState';
import { SwapSettingsDialog } from './SwapSettingsDialog';
import type { SwapFormState2 } from './types';
import * as styles from './styles.module.css';

/**
 * Clears transient per-swap inputs after a successful broadcast: the amount,
 * receiver, nonce, slippage, and all network-fee overrides. The token/chain
 * selection is preserved so the user can immediately start another swap.
 */
function resetAfterBroadcast(
  state: Partial<SwapFormState2>
): Partial<SwapFormState2> {
  return {
    ...state,
    inputAmount: '',
    to: undefined,
    nonce: undefined,
    slippage: undefined,
    networkFeeSpeed: undefined,
    maxPriorityFee: undefined,
    maxFee: undefined,
    gasPrice: undefined,
    gasLimit: undefined,
  };
}

const SWAP_FORM_SEARCH_PARAM_KEYS: (keyof SwapFormState2)[] = [
  'inputChain',
  'inputFungibleId',
  'inputAmount',
  'inputKind',
  'outputChain',
  'outputFungibleId',
  'to',
  'slippage',
  'nonce',
];

function SwapFormComponent({
  address,
  positions,
  networks,
}: {
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const [
    formState,
    setFormState,
    reverseTokens,
    setUserFormState,
    outputDefaultPending,
    selectInput,
    selectOutput,
  ] = useFormState({
    address,
    positions,
    networks,
  });

  const { inputPosition, outputPosition } = useFormPositions({
    formState,
    positions,
    networks,
  });

  const inputNetworkConfig = useMemo(
    () =>
      formState.inputChain
        ? networks.getByNetworkId(createChain(formState.inputChain)) ?? null
        : null,
    [networks, formState.inputChain]
  );
  const outputNetworkConfig = useMemo(
    () =>
      formState.outputChain
        ? networks.getByNetworkId(createChain(formState.outputChain)) ?? null
        : null,
    [networks, formState.outputChain]
  );

  const { isCrossEcosystem, receiverEcosystemMismatch, outputEcosystem } =
    useMemo(
      () =>
        getCrossEcosystemState({
          inputNetwork: inputNetworkConfig,
          outputNetwork: outputNetworkConfig,
          to: formState.to,
        }),
      [inputNetworkConfig, outputNetworkConfig, formState.to]
    );

  // Clear receiver fields when the form transitions out of cross-ecosystem
  // (the address is no longer required) or when the output ecosystem itself
  // changes (an address from one ecosystem can never be valid for another).
  useEffect(() => {
    if (!formState.to) return;
    setUserFormState((state) => ({ ...state, to: undefined }));
    // Intentionally keyed only on the ecosystem-relevant signals — chain-
    // within-ecosystem switches must not clear the user's input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputEcosystem, isCrossEcosystem]);

  const { quote, quotesQuery, setUserQuoteId, resolvedInputAmount } =
    useSwapQuote({
      address,
      formState,
      inputPosition,
      outputPosition,
      isCrossEcosystem,
      outputEcosystem,
    });

  // Single shared gas-prices fetch for the input chain. Powers the local fee
  // scaling (displayed fee + applied transactions) — gas changes never refetch
  // the quote. Polled so the displayed fee tracks the current base fee.
  const inputChainForGas = useMemo(
    () => (formState.inputChain ? createChain(formState.inputChain) : null),
    [formState.inputChain]
  );
  const { data: gasPrices } = useGasPrices(inputChainForGas, {
    refetchInterval: 20000,
    keepPreviousData: true,
  });

  // Auto-revert to token mode when the input token has no price.
  useEffect(() => {
    if (
      formState.inputKind === 'currency' &&
      inputPosition &&
      inputPosition.fungible.meta.price == null
    ) {
      setUserFormState((state) => ({
        ...state,
        inputKind: 'token',
        inputAmount: '',
      }));
    }
  }, [formState.inputKind, inputPosition, setUserFormState]);

  const priceImpact = useMemo(
    () =>
      calculatePriceImpactFromPositions({
        inputValue: resolvedInputAmount || null,
        outputValue: quote?.outputAmount?.quantity ?? null,
        inputPosition,
        outputPosition,
      }),
    [
      resolvedInputAmount,
      quote?.outputAmount?.quantity,
      inputPosition,
      outputPosition,
    ]
  );

  // "Price unknown" should be derived purely from the input position so it
  // doesn't flicker as quotes refetch in the background.
  const inputPriceUnknown =
    Boolean(formState.inputAmount) &&
    Number(formState.inputAmount) > 0 &&
    inputPosition != null &&
    inputPosition.fungible.meta.price == null;

  // Keep showing warnings while a refetch is in flight as long as we still
  // have a previous quote — otherwise warnings flicker every ~20s.
  const quoteSettled = quotesQuery.done || quote != null;

  const showPriceImpactCallout =
    inputPriceUnknown ||
    (quoteSettled &&
      (priceImpact?.kind === 'n/a' ||
        (priceImpact?.kind === 'loss' && priceImpact.level === 'high')));

  const showPriceImpactWarning =
    quoteSettled &&
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const isCrossChain = formState.inputChain !== formState.outputChain;

  const hasZeroInputBalance =
    !inputPosition || new BigNumber(inputPosition.amount.quantity).isZero();
  const shouldShowTopUpCTA =
    quote?.error?.code === 2 ||
    (quote?.error?.code === 1 && hasZeroInputBalance);

  const trackTransactionFormed = useEvent(() => {
    if (!quote) return;
    walletPort.request('transactionFormed', {
      formState,
      quote,
      scope: isCrossChain ? 'Bridge' : 'Swap',
      warningWasShown: Boolean(showPriceImpactCallout),
      outputAmountColor: showPriceImpactWarning ? 'red' : 'grey',
      enoughBalance:
        inputPosition && resolvedInputAmount
          ? new BigNumber(inputPosition.amount.quantity).gte(
              new BigNumber(resolvedInputAmount)
            )
          : false,
      slippagePercent: formState.inputChain
        ? getSlippageOptions({
            chain: createChain(formState.inputChain),
            userSlippage:
              formState.slippage && formState.slippage !== 'auto'
                ? Number(formState.slippage)
                : null,
          }).slippagePercent
        : undefined,
    });
  });

  useEffect(() => {
    if (quote && quotesQuery.done && !quotesQuery.isLoading) {
      trackTransactionFormed();
    }
  }, [quote, quotesQuery.done, quotesQuery.isLoading, trackTransactionFormed]);

  const settingsDialog = useDialog2();

  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();
  const devForceShowOnboarding = useStore(swapOnboardingDevForceShowStore);
  const { readonlyWallOverride } = useStore(devMenuStore);
  const readonlyWallDisabled = readonlyWallOverride === 'disabled';
  const showSwapOnboarding =
    devForceShowOnboarding ||
    preferences?.crossChainSwapOnboardingShown !== true;
  const closeSwapOnboarding = useEvent(() => {
    if (devForceShowOnboarding) {
      // Dev-triggered open: just close locally, don't write the flag.
      clearSwapOnboardingDevForceShow();
      return;
    }
    setPreferences({ crossChainSwapOnboardingShown: true });
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { data: inputFungibleUsdInfo } = useAssetListFungibles({
    fungibleIds: [formState.inputFungibleId],
    currency: 'usd',
  });

  const [simulationResult, setSimulationResult] =
    useState<SimulationResult>(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    setSimulationResult(null);
    setHasSimulated(false);
  }, [
    formState.inputAmount,
    formState.inputFungibleId,
    formState.outputFungibleId,
    formState.inputChain,
    formState.outputChain,
    // Reset when the user switches quote provider (or the active quote is
    // replaced) — the simulation is no longer comparable to the new quote's
    // outputAmount and would falsely fire the output-mismatch check.
    quote?.contractMetadata?.id,
  ]);

  const httpSource = useHttpClientSource();
  const receiverAddress =
    formState.to && formState.to.toLowerCase() !== address.toLowerCase()
      ? formState.to
      : null;
  const { data: receiverPositionsData } = useWalletSimplePositions(
    { address: receiverAddress ?? address, currency },
    { source: httpSource },
    { enabled: receiverAddress != null, keepPreviousData: true }
  );
  const receivePositions = receiverAddress
    ? receiverPositionsData?.data ?? []
    : positions;

  const { mutate: handleSignTransaction, ...signMutation } = useMutation({
    mutationFn: async (result: SimulationResult) => {
      invariant(quote, 'Quote must exist to sign');
      invariant(wallet, 'Wallet must be loaded to sign');
      invariant(inputPosition, 'inputPosition must be defined');
      invariant(outputPosition, 'outputPosition must be defined');
      invariant(formState.inputAmount, 'inputAmount must be set');
      invariant(resolvedInputAmount, 'resolvedInputAmount must be set');
      invariant(quote.transactionSwap, 'Quote must have a swap transaction');

      const inputNetwork = networks.getByNetworkId(
        createChain(formState.inputChain)
      );
      invariant(inputNetwork, 'inputNetwork must be defined');
      const outputNetwork = networks.getByNetworkId(
        createChain(formState.outputChain)
      );
      invariant(outputNetwork, 'outputNetwork must be defined');

      const isCrossChain = formState.inputChain !== formState.outputChain;
      const interpretationAction = result?.data?.action ?? null;

      // Apply the local network-fee override to the transactions we sign. Only
      // the transactions change; networkFee/outputAmount/etc. stay as quoted.
      const configuredQuote = applyTransactionConfiguration(
        quote,
        toConfiguration(formState),
        gasPrices ?? null
      );

      // Quote-derived EVM txs come back with a backend-assigned nonce that's
      // stale once another queue is in flight. Strip it from every step so
      // prepareNonce recomputes against the freshest local+RPC state at sign
      // time. Exception: a user-entered nonce in form state overrides the
      // first step only.
      const userNonce =
        formState.nonce != null && isNumeric(formState.nonce)
          ? parseInt(formState.nonce)
          : null;
      const withNonce = (
        tx: MultichainTransaction,
        nonce: number
      ): MultichainTransaction => (tx.evm ? { evm: { ...tx.evm, nonce } } : tx);
      const withoutNonce = (tx: MultichainTransaction): MultichainTransaction =>
        tx.evm
          ? (() => {
              const { nonce: _omit, ...rest } = tx.evm;
              return { evm: rest as typeof tx.evm };
            })()
          : tx;

      const inputUsdPrice =
        inputFungibleUsdInfo?.data?.at(0)?.meta.price ?? null;
      const inputAmountBn = new BigNumber(resolvedInputAmount);
      const value =
        inputPosition.fungible.meta.price != null
          ? inputAmountBn
              .multipliedBy(inputPosition.fungible.meta.price)
              .toNumber()
          : null;
      const usdValue =
        inputUsdPrice != null
          ? inputAmountBn.multipliedBy(inputUsdPrice).toNumber()
          : null;
      const spendAmount = {
        currency,
        quantity: resolvedInputAmount,
        value,
        usdValue,
      };

      const steps: SignStep[] = [];

      const approveToasterView: ToasterView = {
        kind: 'approve',
        token: {
          symbol: inputPosition.fungible.symbol,
          iconUrl: inputPosition.fungible.iconUrl,
        },
        chain: { iconUrl: inputNetwork.icon_url ?? null },
      };
      const swapToasterView: ToasterView = {
        kind: isCrossChain ? 'bridge' : 'swap',
        sent: {
          symbol: inputPosition.fungible.symbol,
          iconUrl: inputPosition.fungible.iconUrl,
        },
        received: {
          symbol: outputPosition.fungible.symbol,
          iconUrl: outputPosition.fungible.iconUrl,
        },
        receivedChain: { iconUrl: outputNetwork.icon_url ?? null },
      };

      if (configuredQuote.transactionApprove) {
        const approveTx = configuredQuote.transactionApprove;
        invariant(
          approveTx.evm,
          'Approve transaction must be EVM (Solana has no allowance step)'
        );
        const fallbackApproveAction = createApproveAddressAction2({
          transaction: toIncomingTransaction(approveTx.evm),
          hash: null,
          explorerUrl: null,
          fungible: inputPosition.fungible,
          amount: spendAmount,
          network: inputNetwork,
        });
        const approveMultichain = toMultichainTransaction(approveTx);
        steps.push({
          kind: 'send',
          params: {
            transaction:
              userNonce != null
                ? withNonce(approveMultichain, userNonce)
                : withoutNonce(approveMultichain),
            chain: formState.inputChain,
            initiator: INTERNAL_ORIGIN,
            clientScope: 'Swap',
            actionType: 'Approve',
            feeValueCommon: quote.networkFee?.amount?.quantity || '0',
            addressAction: interpretationAction ?? fallbackApproveAction,
            warningWasShown: Boolean(showPriceImpactCallout),
            outputAmountColor: showPriceImpactWarning ? 'red' : 'grey',
          },
          toaster:
            isDeviceAccount(wallet) ||
            formState.inputChain === NetworkId.Ethereum
              ? approveToasterView
              : swapToasterView,
        });
      }

      const swapTx = configuredQuote.transactionSwap;
      invariant(swapTx, 'Configured quote must have a swap transaction');
      const fallbackSwapAction = isCrossChain
        ? createBridgeAddressAction2({
            address,
            transaction: toMultichainTransaction(swapTx),
            hash: null,
            explorerUrl: null,
            spendFungible: inputPosition.fungible,
            spendAmount,
            receiveFungible: outputPosition.fungible,
            receiveAmount: quote.outputAmount,
            inputNetwork,
            outputNetwork,
            receiverAddress: formState.to ?? address,
          })
        : createTradeAddressAction2({
            address,
            transaction: toMultichainTransaction(swapTx),
            hash: null,
            explorerUrl: null,
            spendFungible: inputPosition.fungible,
            spendAmount,
            receiveFungible: outputPosition.fungible,
            receiveAmount: quote.outputAmount,
            network: inputNetwork,
            rate: quote.rate,
          });

      const swapMultichain = toMultichainTransaction(swapTx);
      // Swap is step 0 only when there's no approve; honor userNonce there.
      // When swap follows approve, it's step 1+ — strip and let prepareNonce
      // resolve, since prior step's nonce isn't known until broadcast.
      const swapIsFirstStep = !quote.transactionApprove;
      steps.push({
        kind: 'send',
        params: {
          transaction:
            swapIsFirstStep && userNonce != null
              ? withNonce(swapMultichain, userNonce)
              : withoutNonce(swapMultichain),
          chain: formState.inputChain,
          initiator: INTERNAL_ORIGIN,
          clientScope: isCrossChain ? 'Bridge' : 'Swap',
          actionType: 'Trade',
          feeValueCommon: quote.networkFee?.amount?.quantity || '0',
          addressAction: interpretationAction ?? fallbackSwapAction,
          quote,
          outputChain: formState.outputChain,
          warningWasShown: Boolean(showPriceImpactCallout),
          outputAmountColor: showPriceImpactWarning ? 'red' : 'grey',
        },
        toaster: swapToasterView,
      });

      // Resolves on step-1 broadcast (form reset + button unblock); rejects
      // on any pre-broadcast failure of step 1. Post-broadcast on-chain
      // failures of step 1 reach the queue promise after we've already
      // resolved — they're surfaced by the toaster, not here.
      // If another queue is already in flight when we enqueue, our queue
      // will sit in line — don't block the form on it; reset and unblock
      // immediately so the user can start the next swap.
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        const { promise: queuePromise } = signTransactions(steps, {
          wallet,
          holdToSign: false,
          bluetoothSupportEnabled:
            globalPreferences?.bluetoothSupportEnabled ?? null,
          onEvent: (event) => {
            if (event.type === 'step-pending' && event.index === 0) {
              settle(() => {
                setUserFormState(resetAfterBroadcast);
                resolve();
              });
            } else if (event.type === 'step-error' && event.index === 0) {
              settle(() => reject(event.error));
            } else if (event.type === 'queue-aborted' && event.index === 0) {
              settle(() => reject(new QueueAbortError(0, [])));
            }
          },
        });

        // signTransactions appends synchronously, so length > 1 means
        // there's at least one other queue ahead of ours.
        if (getQueues().length > 1) {
          settle(() => {
            setUserFormState(resetAfterBroadcast);
            resolve();
          });
        }

        // Catches pre-flight rejections (e.g. ReadonlyWalletError) that
        // never emit step events, plus any rejection that races onEvent.
        queuePromise.catch((err) => {
          const unwrapped =
            err instanceof QueueError && err.failedAt === 0 ? err.cause : err;
          settle(() => reject(unwrapped));
        });
      });
    },
    onError: (error) => {
      if (error instanceof QueueAbortError) return;
      // eslint-disable-next-line no-console
      console.error('SwapForm2 sign failed', error);
    },
  });

  // Clear the sign error when any of the same form-state signals that reset
  // simulation change — a stale error no longer relates to what would be
  // signed next. Re-firing the sign mutation also clears it automatically.
  useEffect(() => {
    signMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.inputAmount,
    formState.inputFungibleId,
    formState.outputFungibleId,
    formState.inputChain,
    formState.outputChain,
    quote?.contractMetadata?.id,
  ]);

  // Single source of truth for: which warning card to show, whether
  // <UnverifiedWarning /> should render, whether to block auto-sign, and
  // which dangerTitle (if any) to use. See resolveTransactionWarning.
  const resolved = useMemo(
    () =>
      resolveTransactionWarning({
        quote,
        quotesQuery,
        formState,
        simulationResult,
        inputNetwork: inputNetworkConfig,
        outputNetwork: outputNetworkConfig,
      }),
    [
      quote,
      quotesQuery,
      formState,
      simulationResult,
      inputNetworkConfig,
      outputNetworkConfig,
    ]
  );

  const isUnverified = resolved.unverified;

  const handleSimulationCompleted = (result: SimulationResult) => {
    setSimulationResult(result);
    // Re-resolve with the *fresh* result rather than relying on the state
    // we just scheduled — `simulationResult` is still stale on this render.
    const fresh = resolveTransactionWarning({
      quote,
      quotesQuery,
      formState,
      simulationResult: result,
      inputNetwork: inputNetworkConfig,
      outputNetwork: outputNetworkConfig,
    });
    if (fresh.blocksAutoSign) {
      setHasSimulated(true);
      return;
    }
    handleSignTransaction(result);
  };

  const cancelToastRef = useRef<PopoverToastHandle>(null);
  const handleCancel = () => {
    setUserFormState(() => ({}));
    cancelToastRef.current?.showToast();
  };

  const location = useLocation();
  const walletSelectTo = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of SWAP_FORM_SEARCH_PARAM_KEYS) {
      params.append('clearSearchParams', key);
    }
    return { pathname: '/wallet-select', search: `?${params.toString()}` };
  }, []);
  const walletSelectState = useMemo(
    () => ({ from: `${location.pathname}${location.search}` }),
    [location.pathname, location.search]
  );

  return (
    <>
      <div className={styles.absoluteHeader}>
        <HStack gap={8} alignItems="center">
          <Button
            kind="ghost"
            size={36}
            style={{ padding: 6 }}
            title="Swap settings"
            onClick={settingsDialog.openDialog}
          >
            <SettingsIcon style={{ display: 'block' }} />
          </Button>
          <UnstyledLink
            to={walletSelectTo}
            state={walletSelectState}
            title="Change Wallet"
          >
            <WalletAvatar
              active={false}
              address={address}
              size={24}
              borderRadius={6}
            />
          </UnstyledLink>
        </HStack>
      </div>
      <SwapSettingsDialog
        open={settingsDialog.open}
        onClose={settingsDialog.closeDialog}
      />
      <SwapOnboardingDialog
        open={showSwapOnboarding}
        onClose={closeSwapOnboarding}
      />
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Swap" />
        <VStack
          gap={24}
          style={{
            position: 'relative',
            flex: 1,
            alignContent: 'start',
            paddingBottom: 112,
          }}
        >
          <div className={styles.formContainer}>
            <InputPosition
              formState={formState}
              onChange={setFormState}
              onSelectFungible={selectInput}
              position={inputPosition}
              positions={positions}
              resolvedInputAmount={resolvedInputAmount}
            />
            <MiddleLine />
            <ReverseButton onClick={reverseTokens} />
            <OutputPosition
              onSelectFungible={selectOutput}
              position={outputPosition}
              outputAmount={quote?.outputAmount?.quantity ?? null}
              positions={positions}
              receiverPositions={receivePositions}
              networks={networks}
              priceImpact={priceImpact}
              inputChainId={formState.inputChain || null}
              outputChainId={formState.outputChain || null}
              inputKind={formState.inputKind ?? 'token'}
              defaultPending={outputDefaultPending}
            />
          </div>
          <ReceiverAddressSelector
            formState={formState}
            onChange={setFormState}
            networks={networks}
            isCrossEcosystem={isCrossEcosystem}
            receiverEcosystemMismatch={receiverEcosystemMismatch}
            receiveToAnotherAddress={
              preferences?.receiveToAnotherAddress ?? false
            }
          />
          <QuoteDetails
            quote={quote}
            quotesQuery={quotesQuery}
            formState={formState}
            networks={networks}
            address={address}
            gasPrices={gasPrices ?? null}
            configuration={toConfiguration(formState)}
            onConfigurationChange={(value) => {
              const partial = fromConfiguration(value);
              setUserFormState((state) => ({ ...state, ...partial }));
            }}
            onProviderChange={setUserQuoteId}
          />
          <TransactionWarning warning={resolved.warning} />
          {showPriceImpactCallout ? (
            <PriceImpactWarning priceImpact={priceImpact} />
          ) : null}
          {isUnverified ? <UnverifiedWarning /> : null}
          <UKDisclaimer />
          <USDisclaimer />
        </VStack>
      </PageColumn>
      <PopoverToast
        ref={cancelToastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Swap cancelled! No funds were sent
      </PopoverToast>
      <div className={styles.absoluteFooter}>
        <Spacer height={16} />
        {signMutation.isError &&
        !(signMutation.error instanceof QueueAbortError) ? (
          <VStack gap={0} style={{ paddingBottom: 8 }}>
            <ErrorMessage
              error={getError(signMutation.error)}
              hardwareError={getHardwareError(signMutation.error)}
            />
          </VStack>
        ) : null}
        {wallet && isReadonlyAccount(wallet) && !readonlyWallDisabled ? (
          <ReadonlySignButton wallet={wallet} />
        ) : wallet && shouldShowTopUpCTA ? (
          <TopUpWalletCTA wallet={wallet} />
        ) : (
          <SwapButton
            address={address}
            formState={formState}
            quote={quote}
            quotesQuery={quotesQuery}
            gasPrices={gasPrices ?? null}
            simulated={hasSimulated}
            signing={signMutation.isLoading}
            isCrossEcosystem={isCrossEcosystem}
            receiverEcosystemMismatch={receiverEcosystemMismatch}
            isCrossChain={isCrossChain}
            onSimulationCompleted={handleSimulationCompleted}
            onSign={() => handleSignTransaction(simulationResult)}
            onCancel={handleCancel}
            dangerTitle={
              resolved.dangerTitle ??
              (inputPriceUnknown ||
              priceImpact?.kind === 'n/a' ||
              showPriceImpactWarning
                ? 'Proceed Anyway'
                : undefined)
            }
          />
        )}
        <PageBottom />
      </div>
    </>
  );
}

/** Sets initial chainInput to last used chain for current address */
function SwapFormWrapper({
  address,
  ready,
}: {
  address: string;
  ready: boolean;
}) {
  const { currency } = useCurrency();
  const navigationType = useNavigationType();
  const isBackOrForward = navigationType === 'POP';
  const [searchParams, setSearchParams] = useSearchParams();
  const [prepared, setPrepared] = useState(
    isBackOrForward || searchParams.has('inputChain')
  );
  const { data: lastUsedChain, isFetchedAfterMount } = useQuery({
    enabled: ready && !prepared,
    // Avoid using stale value. Leaving form and coming back should use new value instantly
    staleTime: 0,
    queryKey: ['wallet/getLastSwapChainByAddress', address],
    queryFn: () => walletPort.request('getLastSwapChainByAddress', { address }),
  });

  const refetchInterval = usePositionsRefetchInterval(20000);
  const { data, isError, refetch } = useWalletSimplePositions(
    { address, currency },
    { source: useHttpClientSource() },
    { enabled: ready, refetchInterval }
  );

  const positions = data?.data;

  const { networks, isFetching } = useNetworks();

  useEffect(() => {
    if (prepared || !isFetchedAfterMount) {
      return;
    }
    if (lastUsedChain) {
      searchParams.set('inputChain', lastUsedChain);
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

  return isError ? (
    <SwapFormError onReload={() => refetch()} />
  ) : prepared && positions && networks && !isFetching ? (
    <SwapFormComponent
      address={address}
      positions={positions}
      networks={networks}
    />
  ) : (
    <SwapFormSkeleton />
  );
}

export function SwapForm2() {
  useBackgroundKind({ kind: 'white' });
  const { preferences } = usePreferences();
  const { singleAddress: address, ready } = useAddressParams();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" />;
  }
  return <SwapFormWrapper address={address} ready={ready} />;
}
