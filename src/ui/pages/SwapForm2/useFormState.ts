import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import type { Networks } from 'src/modules/networks/Networks';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { createChain } from 'src/modules/networks/Chain';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useReceiveFungibles } from 'src/modules/zerion-api/hooks/useReceiveFungibles';
import type { HandleChangeFunction, SwapFormState2 } from './types';

const ETH_ID = 'eth';
const SOL_ID = '11111111111111111111111111111111';
const USDC_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDT_ID = '0xdac17f958d2ee523a2206206994597c13d831ec7';

/**
 * Network-fee overrides are tied to a specific chain + quote. When the swap's
 * input/output chain or position changes the quote is refetched against new
 * params, so any user-entered gas overrides (speed, fees, gas price/limit) no
 * longer apply and must be cleared.
 */
const CLEARED_GAS_OVERRIDES: Pick<
  SwapFormState2,
  'networkFeeSpeed' | 'maxPriorityFee' | 'maxFee' | 'gasPrice' | 'gasLimit'
> = {
  networkFeeSpeed: undefined,
  maxPriorityFee: undefined,
  maxFee: undefined,
  gasPrice: undefined,
  gasLimit: undefined,
};

function useDefaultFormState({
  inputChainId,
  inputFungibleId,
  outputChainId,
  outputFungibleId,
  address,
  positions,
  networks,
}: {
  inputChainId?: string;
  inputFungibleId?: string;
  outputChainId?: string;
  outputFungibleId?: string;
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}): { defaults: SwapFormState2; outputDefaultPending: boolean } {
  const matchesOutput = useCallback(
    (chainId: string, fungibleId: string) =>
      Boolean(outputChainId) &&
      Boolean(outputFungibleId) &&
      chainId === outputChainId &&
      fungibleId === outputFungibleId,
    [outputChainId, outputFungibleId]
  );

  const preferredInputChain = useMemo(() => {
    const chainDistribution = positions.reduce<Record<string, number>>(
      (acc, position) => {
        acc[position.chain.id] =
          (acc[position.chain.id] || 0) + (position.amount.value || 0);
        return acc;
      },
      {}
    );
    if (inputChainId && chainDistribution[inputChainId]) {
      return inputChainId;
    }
    const sortedChains = Object.keys(chainDistribution).sort(
      (a, b) => (chainDistribution[b] || 0) - (chainDistribution[a] || 0)
    );
    for (const chainId of sortedChains) {
      const networkConfig = networks.getByNetworkId(createChain(chainId));
      if (networkConfig?.supports_trading || networkConfig?.supports_bridging) {
        return chainId;
      }
    }
    return getAddressType(address) === 'evm'
      ? NetworkId.Ethereum
      : NetworkId.Solana;
  }, [address, positions, networks, inputChainId]);

  const { defaultInputChain, defaultInputFungibleId } = useMemo(() => {
    const sortedByValue = (list: FungiblePosition[]) =>
      [...list].sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0));

    const onPreferredChain = sortedByValue(
      positions.filter(
        (p) => p.chain.id === preferredInputChain && p.amount.value
      )
    );
    const firstOnPreferred = onPreferredChain.find(
      (p) => !matchesOutput(p.chain.id, p.fungible.id)
    );
    if (firstOnPreferred) {
      return {
        defaultInputChain: preferredInputChain,
        defaultInputFungibleId: firstOnPreferred.fungible.id,
      };
    }

    const acrossChains = sortedByValue(positions.filter((p) => p.amount.value));
    const firstAcrossChains = acrossChains.find(
      (p) => !matchesOutput(p.chain.id, p.fungible.id)
    );
    if (firstAcrossChains) {
      return {
        defaultInputChain: firstAcrossChains.chain.id,
        defaultInputFungibleId: firstAcrossChains.fungible.id,
      };
    }

    const networkConfig = networks.getByNetworkId(
      createChain(preferredInputChain)
    );
    const nativeOnPreferred =
      networkConfig?.native_asset?.id ||
      (getAddressType(address) === 'evm' ? ETH_ID : SOL_ID);
    if (!matchesOutput(preferredInputChain, nativeOnPreferred)) {
      return {
        defaultInputChain: preferredInputChain,
        defaultInputFungibleId: nativeOnPreferred,
      };
    }

    const ethereumFallback = matchesOutput(NetworkId.Ethereum, ETH_ID)
      ? USDC_ID
      : ETH_ID;
    return {
      defaultInputChain: NetworkId.Ethereum,
      defaultInputFungibleId: ethereumFallback,
    };
  }, [preferredInputChain, positions, networks, address, matchesOutput]);

  const inputSupportsTrading = useMemo(() => {
    const networkConfig = networks.getByNetworkId(
      createChain(defaultInputChain)
    );
    return Boolean(networkConfig?.supports_trading);
  }, [defaultInputChain, networks]);

  const defaultOutputChain = useMemo(() => {
    if (inputSupportsTrading) {
      return defaultInputChain;
    }
    return NetworkId.Ethereum;
  }, [defaultInputChain, inputSupportsTrading]);

  const { currency } = useCurrency();
  const { data: receiveFungiblesData } = useReceiveFungibles({
    chain: defaultOutputChain,
    currency,
  });

  const effectiveInputFungibleId = inputFungibleId ?? defaultInputFungibleId;

  const outputDefaultPending =
    inputSupportsTrading && !receiveFungiblesData && outputFungibleId == null;

  const defaultOutputFungibleId = useMemo<string | undefined>(() => {
    if (!inputSupportsTrading) {
      return ETH_ID;
    }
    if (!receiveFungiblesData) {
      return undefined;
    }
    const popular = receiveFungiblesData.data.popular;
    const others = receiveFungiblesData.data.others;
    for (const fungible of [...popular, ...others]) {
      if (fungible.id !== effectiveInputFungibleId) {
        return fungible.id;
      }
    }
    const networkConfig = networks.getByNetworkId(
      createChain(defaultOutputChain)
    );
    const fallbackList = [
      networkConfig?.native_asset?.id,
      USDC_ID,
      USDT_ID,
    ].filter((id): id is string => Boolean(id));
    for (const id of fallbackList) {
      if (id !== effectiveInputFungibleId) {
        return id;
      }
    }
    return USDC_ID;
  }, [
    inputSupportsTrading,
    effectiveInputFungibleId,
    defaultOutputChain,
    networks,
    receiveFungiblesData,
  ]);

  const defaults = useMemo<SwapFormState2>(() => {
    return {
      inputChain: defaultInputChain,
      inputFungibleId: defaultInputFungibleId,
      outputChain: defaultOutputChain,
      outputFungibleId: defaultOutputFungibleId,
    };
  }, [
    defaultInputChain,
    defaultInputFungibleId,
    defaultOutputChain,
    defaultOutputFungibleId,
  ]);

  return useMemo(
    () => ({ defaults, outputDefaultPending }),
    [defaults, outputDefaultPending]
  );
}

export function useFormState({
  address,
  positions,
  networks,
}: {
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const [userFormState, setUserFormState] =
    useSearchParamsObj<SwapFormState2>();

  const { defaults: defaultFormState, outputDefaultPending } =
    useDefaultFormState({
      address,
      positions,
      networks,
      inputChainId: userFormState.inputChain,
      inputFungibleId: userFormState.inputFungibleId,
      outputChainId: userFormState.outputChain,
      outputFungibleId: userFormState.outputFungibleId,
    });

  const formState = useMemo(() => {
    return {
      ...defaultFormState,
      ...userFormState,
    };
  }, [defaultFormState, userFormState]);

  // Promote resolved input defaults into the URL so the URL reflects what
  // the user sees. Scoped to inputChain/inputFungibleId only — outputs stay
  // out of the URL so they can keep recomputing from fresh data per the
  // spread-merge contract. Only fills keys that are missing; never
  // overwrites existing URL values.
  // Motivation: without this, the resolved input default is recomputed from
  // positions on every balance refetch. If the user hasn't picked an input
  // explicitly, a fresh balance snapshot can shift `defaultInputFungibleId`
  // (e.g. a different position is now top by value) and the displayed input
  // position changes underfoot. Pinning the first resolved default into the
  // URL freezes it for the session.
  useEffect(() => {
    const missingInputChain =
      userFormState.inputChain == null && defaultFormState.inputChain != null;
    const missingInputFungibleId =
      userFormState.inputFungibleId == null &&
      defaultFormState.inputFungibleId != null;
    if (!missingInputChain && !missingInputFungibleId) return;
    setUserFormState((state) => ({
      ...state,
      ...(missingInputChain
        ? { inputChain: defaultFormState.inputChain }
        : null),
      ...(missingInputFungibleId
        ? { inputFungibleId: defaultFormState.inputFungibleId }
        : null),
    }));
  }, [
    userFormState.inputChain,
    userFormState.inputFungibleId,
    defaultFormState.inputChain,
    defaultFormState.inputFungibleId,
    setUserFormState,
  ]);

  const handleChange = useCallback<HandleChangeFunction>(
    (key, value) => setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const selectInput = useCallback(
    (chainId: string, fungibleId: string) => {
      setUserFormState((state) => {
        const collidesWithOutput =
          state.outputChain === chainId &&
          state.outputFungibleId === fungibleId;
        return {
          ...state,
          ...CLEARED_GAS_OVERRIDES,
          inputChain: chainId,
          inputFungibleId: fungibleId,
          ...(collidesWithOutput
            ? { outputChain: undefined, outputFungibleId: undefined }
            : null),
        };
      });
    },
    [setUserFormState]
  );

  const selectOutput = useCallback(
    (chainId: string, fungibleId: string) => {
      setUserFormState((state) => {
        const collidesWithInput =
          state.inputChain === chainId && state.inputFungibleId === fungibleId;
        return {
          ...state,
          ...CLEARED_GAS_OVERRIDES,
          outputChain: chainId,
          outputFungibleId: fungibleId,
          ...(collidesWithInput
            ? { inputChain: undefined, inputFungibleId: undefined }
            : null),
        };
      });
    },
    [setUserFormState]
  );

  const reverseTokens = useCallback(() => {
    setUserFormState((state) => {
      const newInputChain = state.outputChain || defaultFormState.outputChain;
      const newOutputChain = state.inputChain || defaultFormState.inputChain;
      const isSameChain = newInputChain === newOutputChain;
      return {
        ...state,
        ...CLEARED_GAS_OVERRIDES,
        inputChain: newInputChain,
        outputChain: newOutputChain,
        inputFungibleId:
          state.outputFungibleId || defaultFormState.outputFungibleId,
        outputFungibleId:
          state.inputFungibleId || defaultFormState.inputFungibleId,
        inputAmount: undefined,
        outputAmount: undefined,
        ...(isSameChain ? { to: undefined } : null),
      };
    });
  }, [defaultFormState, setUserFormState]);

  return [
    formState,
    handleChange,
    reverseTokens,
    setUserFormState,
    outputDefaultPending,
    selectInput,
    selectOutput,
  ] as const;
}
