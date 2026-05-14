import React, { useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  createApproveAddressAction2,
  createBridgeAddressAction2,
} from 'src/modules/ethereum/transactions/addressAction/addressActionMain';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { useQuotesV2 } from 'src/ui/shared/requests/useQuotes';
import { resolveTokenValue } from 'src/ui/components/AmountInput/inputKind';
import {
  toIncomingTransaction,
  toMultichainTransaction,
} from 'src/shared/types/Quote';
import {
  signTransactions,
  QueueAbortError,
  QueueError,
  type SignStep,
} from 'src/ui/components/TransactionSigner';
import {
  useGlobalPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { walletPort } from 'src/ui/shared/channels';
import { showSuccessToast } from 'src/ui/components/SuccessToast';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useBackgroundKind } from 'src/ui/components/Background';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { getError } from 'get-error';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { InputPosition } from 'src/ui/pages/SwapForm2/InputPosition';
import type { SwapFormState2 } from 'src/ui/pages/SwapForm2/types';
import { PerpsOnboarding } from '../PerpsOnboarding';
import * as s from './styles.module.css';

const HYPERCORE_CHAIN_ID = 'hypercore';
const HYPERCORE_USDC_FUNGIBLE_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const PERPS_DEPOSIT_SLIPPAGE = '0.5';

const ARBITRUM_CHAIN_ID = 'arbitrum';
const ETHEREUM_CHAIN_ID = 'ethereum';

function useUserFormState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo<Partial<SwapFormState2>>(() => {
    const inputChain = searchParams.get('inputChain') ?? undefined;
    const inputFungibleId = searchParams.get('inputFungibleId') ?? undefined;
    const inputAmount = searchParams.get('inputAmount') ?? undefined;
    const rawInputKind = searchParams.get('inputKind');
    const inputKind: 'token' | 'currency' | undefined =
      rawInputKind === 'token' || rawInputKind === 'currency'
        ? rawInputKind
        : undefined;
    return { inputChain, inputFungibleId, inputAmount, inputKind };
  }, [searchParams]);

  const update = (patch: Partial<SwapFormState2>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    }
    setSearchParams(next, { replace: true });
  };

  return [state, update] as const;
}

function pickDefaultInputChain(positions: FungiblePosition[]): string {
  const ranked = [...positions].sort((a, b) => {
    const av = Number(a.amount.value ?? 0);
    const bv = Number(b.amount.value ?? 0);
    return bv - av;
  });
  const top = ranked.find((p) => Number(p.amount.value ?? 0) > 0);
  if (top) return top.chain.id;
  return ARBITRUM_CHAIN_ID;
}

function pickDefaultFungibleOnChain(
  chainId: string,
  positions: FungiblePosition[]
): string | undefined {
  const onChain = positions.filter((p) => p.chain.id === chainId);
  const usdc = onChain.find(
    (p) =>
      p.fungible.id.toLowerCase() === HYPERCORE_USDC_FUNGIBLE_ID.toLowerCase()
  );
  if (usdc) return usdc.fungible.id;
  const sorted = [...onChain].sort(
    (a, b) => Number(b.amount.value ?? 0) - Number(a.amount.value ?? 0)
  );
  return sorted[0]?.fungible.id;
}

function DepositFormBody({
  address,
  positions,
}: {
  address: string;
  positions: FungiblePosition[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrency();
  const { networks } = useNetworks();
  const { globalPreferences } = useGlobalPreferences();

  const [userFormState, setUserFormState] = useUserFormState();

  const defaultInputChain = useMemo(
    () => pickDefaultInputChain(positions),
    [positions]
  );
  const inputChain = userFormState.inputChain || defaultInputChain;

  const inputFungibleId = useMemo(() => {
    if (userFormState.inputFungibleId) return userFormState.inputFungibleId;
    return pickDefaultFungibleOnChain(inputChain, positions);
  }, [userFormState.inputFungibleId, inputChain, positions]);

  const formState: SwapFormState2 = useMemo(
    () => ({
      inputChain,
      inputFungibleId: inputFungibleId ?? '',
      inputAmount: userFormState.inputAmount,
      inputKind: userFormState.inputKind ?? 'token',
      outputChain: HYPERCORE_CHAIN_ID,
      outputFungibleId: HYPERCORE_USDC_FUNGIBLE_ID,
      to: address,
      slippage: PERPS_DEPOSIT_SLIPPAGE,
    }),
    [
      inputChain,
      inputFungibleId,
      userFormState.inputAmount,
      userFormState.inputKind,
      address,
    ]
  );

  const inputPosition = useMemo(() => {
    return (
      positions.find(
        (p) =>
          p.chain.id === formState.inputChain &&
          p.fungible.id === formState.inputFungibleId
      ) ?? null
    );
  }, [positions, formState.inputChain, formState.inputFungibleId]);

  const inputKind = formState.inputKind ?? 'token';
  const inputPrice = inputPosition?.fungible.meta.price ?? null;
  const resolvedInputAmount = useMemo(() => {
    if (!formState.inputAmount) return null;
    return resolveTokenValue(formState.inputAmount, inputKind, inputPrice);
  }, [formState.inputAmount, inputKind, inputPrice]);

  const inputNetwork = useMemo(
    () =>
      formState.inputChain
        ? networks?.getByNetworkId(createChain(formState.inputChain)) ?? null
        : null,
    [networks, formState.inputChain]
  );

  // Pull USDC fungible info purely for the output card icon/name.
  const { data: usdcFungibles } = useAssetListFungibles({
    fungibleIds: [HYPERCORE_USDC_FUNGIBLE_ID],
    currency,
  });
  const usdcFungible = usdcFungibles?.data?.[0] ?? null;

  const quotesFormState = useMemo(() => {
    const { inputKind: _ik, ...rest } = formState;
    return { ...rest, inputAmount: resolvedInputAmount ?? '' };
  }, [formState, resolvedInputAmount]);

  const inputFiatValue = useMemo(() => {
    if (!resolvedInputAmount || inputPrice == null) return null;
    const v = Number(resolvedInputAmount) * inputPrice;
    return Number.isFinite(v) ? v : null;
  }, [resolvedInputAmount, inputPrice]);

  const { pathname } = window.location;
  const quotesQuery = useQuotesV2({
    address,
    currency,
    formState: quotesFormState,
    enabled:
      Boolean(inputPosition) &&
      Boolean(resolvedInputAmount) &&
      Number(resolvedInputAmount) > 0,
    context: 'Bridge',
    pathname,
    inputFiatValue,
  });

  const quote = quotesQuery.quotes?.[0] ?? null;

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const { mutate: handleDeposit, ...signMutation } = useMutation({
    mutationFn: async () => {
      invariant(quote, 'Quote must exist to sign');
      invariant(wallet, 'Wallet must be loaded to sign');
      invariant(inputPosition, 'Input position must be defined');
      invariant(resolvedInputAmount, 'Input amount must be defined');
      invariant(quote.transactionSwap, 'Quote must have a swap transaction');
      invariant(inputNetwork, 'Input network must be defined');

      const spendAmount = {
        currency,
        quantity: resolvedInputAmount,
        value:
          inputPosition.fungible.meta.price != null
            ? new BigNumber(resolvedInputAmount)
                .multipliedBy(inputPosition.fungible.meta.price)
                .toNumber()
            : null,
        usdValue: null as number | null,
      };

      const steps: SignStep[] = [];
      if (quote.transactionApprove) {
        const approveTx = quote.transactionApprove;
        invariant(approveTx.evm, 'Approve transaction must be EVM');
        const approveMultichain = toMultichainTransaction(approveTx);
        steps.push({
          kind: 'send',
          params: {
            transaction: approveMultichain,
            chain: formState.inputChain,
            initiator: INTERNAL_ORIGIN,
            clientScope: 'Swap',
            feeValueCommon: quote.networkFee?.amount?.quantity || '0',
            addressAction: createApproveAddressAction2({
              transaction: toIncomingTransaction(approveTx.evm),
              hash: null,
              explorerUrl: null,
              fungible: inputPosition.fungible,
              amount: spendAmount,
              network: inputNetwork,
            }),
            warningWasShown: false,
            outputAmountColor: 'grey',
          },
          toaster: {
            kind: 'approve',
            token: {
              symbol: inputPosition.fungible.symbol,
              iconUrl: inputPosition.fungible.iconUrl,
            },
            chain: { iconUrl: inputNetwork.icon_url ?? null },
          },
        });
      }

      const swapTx = quote.transactionSwap;
      const swapMultichain = toMultichainTransaction(swapTx);

      const usdcFakeFungible = usdcFungible ?? {
        id: HYPERCORE_USDC_FUNGIBLE_ID,
        symbol: 'USDC',
        name: 'USD Coin',
        iconUrl: inputPosition.fungible.iconUrl,
        meta: { price: 1 },
      };

      steps.push({
        kind: 'send',
        params: {
          transaction: swapMultichain,
          chain: formState.inputChain,
          initiator: INTERNAL_ORIGIN,
          clientScope: 'Bridge',
          feeValueCommon: quote.networkFee?.amount?.quantity || '0',
          addressAction: createBridgeAddressAction2({
            address,
            transaction: toMultichainTransaction(swapTx),
            hash: null,
            explorerUrl: null,
            spendFungible: inputPosition.fungible,
            spendAmount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            receiveFungible: usdcFakeFungible as any,
            receiveAmount: quote.outputAmount,
            inputNetwork,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            outputNetwork: inputNetwork as any,
            receiverAddress: address,
          }),
          quote,
          outputChain: HYPERCORE_CHAIN_ID,
          warningWasShown: false,
          outputAmountColor: 'grey',
        },
        toaster: {
          kind: 'bridge',
          sent: {
            symbol: inputPosition.fungible.symbol,
            iconUrl: inputPosition.fungible.iconUrl,
          },
          received: {
            symbol: 'USDC',
            iconUrl: usdcFakeFungible.iconUrl ?? null,
          },
          receivedChain: { iconUrl: inputNetwork.icon_url ?? null },
        },
      });

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
                setUserFormState({ inputAmount: '' });
                resolve();
              });
            } else if (event.type === 'step-error' && event.index === 0) {
              settle(() => reject(event.error));
            } else if (event.type === 'queue-aborted' && event.index === 0) {
              settle(() => reject(new QueueAbortError(0, [])));
            }
          },
        });
        queuePromise.catch((err) => {
          const unwrapped =
            err instanceof QueueError && err.failedAt === 0 ? err.cause : err;
          settle(() => reject(unwrapped));
        });
      });
    },
    onSuccess: () => {
      showSuccessToast({
        text: 'Deposit submitted',
        subtitle: 'Funds may take a few minutes to settle',
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/clearinghouseState'],
      });
      queryClient.invalidateQueries({ queryKey: ['walletPortfolio'] });
      queryClient.invalidateQueries({ queryKey: ['hyperliquidBalance'] });
      navigate(-1);
    },
    onError: (error) => {
      if (error instanceof QueueAbortError) return;
      // eslint-disable-next-line no-console
      console.error('PerpsDeposit sign failed', error);
    },
  });

  // Reset sign error when relevant form fields change.
  useEffect(() => {
    signMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.inputAmount,
    formState.inputFungibleId,
    formState.inputChain,
    quote?.contractMetadata?.id,
  ]);

  const insufficientBalance =
    inputPosition != null &&
    resolvedInputAmount != null &&
    new BigNumber(resolvedInputAmount).gt(inputPosition.amount.quantity);

  const submitDisabled =
    !quote ||
    !inputPosition ||
    !resolvedInputAmount ||
    insufficientBalance ||
    quotesQuery.isLoading ||
    signMutation.isLoading;

  return (
    <PageColumn>
      <NavigationTitle title="Deposit" documentTitle="Deposit to Hyperliquid" />
      <PageTop />
      <VStack gap={24} className={s.root}>
        <div className={s.formContainer}>
          <InputPosition
            formState={formState}
            onChange={(key, value) =>
              setUserFormState({ [key]: value } as Partial<SwapFormState2>)
            }
            onSelectFungible={(chainId, fungibleId) =>
              setUserFormState({
                inputChain: chainId,
                inputFungibleId: fungibleId,
                inputAmount: undefined,
              })
            }
            position={inputPosition}
            positions={positions}
            resolvedInputAmount={resolvedInputAmount}
          />
          <div className={s.outputCard}>
            <div className={s.outputIconWrapper}>
              <TokenIcon src={usdcFungible?.iconUrl} symbol="USDC" size={32} />
            </div>
            <VStack gap={2}>
              <UIText kind="body/accent">USDC</UIText>
              <UIText kind="small/regular" color="var(--neutral-600)">
                on Hyperliquid
              </UIText>
            </VStack>
            <div style={{ marginLeft: 'auto' }}>
              <UIText kind="body/accent">
                {quote?.outputAmount?.quantity
                  ? new BigNumber(quote.outputAmount.quantity).toFixed(2)
                  : '—'}
              </UIText>
            </div>
          </div>
        </div>

        <UIText
          kind="caption/regular"
          color="var(--neutral-600)"
          className={s.disclosure}
        >
          Funds may take a few minutes to settle on Hyperliquid.
        </UIText>
      </VStack>

      <div className={s.absoluteFooter}>
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
        <Button
          kind="primary"
          size={48}
          onClick={() => handleDeposit()}
          disabled={submitDisabled}
        >
          {insufficientBalance
            ? 'Insufficient balance'
            : quotesQuery.isLoading && !quote
            ? 'Fetching offers…'
            : signMutation.isLoading
            ? 'Sending…'
            : 'Deposit'}
        </Button>
        <PageBottom />
      </div>
    </PageColumn>
  );
}

function DepositPageInner({ address }: { address: string }) {
  const { currency } = useCurrency();
  const refetchInterval = usePositionsRefetchInterval(20000);
  const { data, isLoading } = useWalletSimplePositions(
    { address, currency },
    { source: useHttpClientSource() },
    { refetchInterval }
  );
  const { networks } = useNetworks();
  const positions = useMemo(() => data?.data ?? [], [data]);

  // Filter to bridgeable EVM positions only.
  const bridgeable = useMemo(() => {
    if (!networks) return [];
    return positions.filter((p) => {
      const net = networks.getByNetworkId(createChain(p.chain.id));
      return net?.supports_bridging || p.chain.id === ETHEREUM_CHAIN_ID;
    });
  }, [positions, networks]);

  const { preferences, setPreferences } = usePreferences();
  const onboardingDismissed = preferences?.perpsOnboardingDismissed === true;
  const [onboardingOpen, setOnboardingOpen] = useState(!onboardingDismissed);

  // Reflect a late-arriving preferences fetch: if the cached value flips to
  // dismissed while the dialog is open from the optimistic state, close it.
  useEffect(() => {
    if (onboardingDismissed) setOnboardingOpen(false);
  }, [onboardingDismissed]);

  if (isLoading || !networks) {
    return (
      <PageColumn>
        <NavigationTitle title="Deposit" />
        <PageTop />
        <UIText kind="body/regular" color="var(--neutral-600)">
          Loading…
        </UIText>
      </PageColumn>
    );
  }

  return (
    <>
      <PerpsOnboarding
        open={onboardingOpen}
        onDismiss={() => {
          setOnboardingOpen(false);
          if (!onboardingDismissed) {
            setPreferences({ perpsOnboardingDismissed: true });
          }
        }}
      />
      <DepositFormBody address={address} positions={bridgeable} />
    </>
  );
}

export function PerpsDeposit() {
  useBackgroundKind({ kind: 'white' });
  const { preferences } = usePreferences();
  const { singleAddress: address, ready } = useAddressParams();
  if (preferences?.testnetMode?.on) {
    return <Navigate to="/" replace={true} />;
  }
  if (!ready || !address) return null;
  return <DepositPageInner address={address} />;
}
