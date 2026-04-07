import { useCallback, useMemo } from 'react';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import type { Networks } from 'src/modules/networks/Networks';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { createChain } from 'src/modules/networks/Chain';
import type { HandleChangeFunction, SwapFormState2 } from './types';

const ETH_ID = 'eth';
const SOL_ID = '11111111111111111111111111111111';
const USDC_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

function useDefaultFormState({
  inputChainId,
  address,
  positions,
  networks,
}: {
  inputChainId?: string;
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
}): SwapFormState2 {
  const defaultInputChain = useMemo(() => {
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

  const defaultInputFungibleId = useMemo(() => {
    const sortedAndFilteredPositions = positions
      .filter((p) => p.chain.id === defaultInputChain && p.amount.value)
      .sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0));
    if (sortedAndFilteredPositions[0]?.fungible.id) {
      return sortedAndFilteredPositions[0].fungible.id;
    }
    const networkConfig = networks.getByNetworkId(
      createChain(defaultInputChain)
    );
    return (
      networkConfig?.native_asset?.id ||
      (getAddressType(address) === 'evm' ? ETH_ID : SOL_ID)
    );
  }, [defaultInputChain, positions, address, networks]);

  const defaultOutputChain = useMemo(() => {
    const networkConfig = networks.getByNetworkId(
      createChain(defaultInputChain)
    );
    if (networkConfig?.supports_trading) {
      return defaultInputChain;
    }
    return getAddressType(address) === 'evm'
      ? NetworkId.Ethereum
      : NetworkId.Solana;
  }, [defaultInputChain, address, networks]);

  const defaultOutputFungibleId = useMemo(() => {
    const networkConfig = networks.getByNetworkId(
      createChain(defaultOutputChain)
    );
    if (
      networkConfig &&
      defaultInputFungibleId !== networkConfig.native_asset?.id
    ) {
      return networkConfig.native_asset?.id;
    }
    return USDC_ID;
  }, [defaultInputFungibleId, defaultOutputChain, networks]);

  return useMemo(() => {
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

  const defaultFormState = useDefaultFormState({
    address,
    positions,
    networks,
    inputChainId: userFormState.inputChain,
  });

  const formState = useMemo(() => {
    return {
      ...defaultFormState,
      ...userFormState,
    };
  }, [defaultFormState, userFormState]);

  const handleChange = useCallback<HandleChangeFunction>(
    (key, value) => setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const reverseTokens = useCallback(() => {
    setUserFormState((state) => ({
      ...state,
      inputChain: state.outputChain || defaultFormState.outputChain,
      outputChain: state.inputChain || defaultFormState.inputChain,
      inputFungibleId:
        state.outputFungibleId || defaultFormState.outputFungibleId,
      outputFungibleId:
        state.inputFungibleId || defaultFormState.inputFungibleId,
      inputAmount: undefined,
      outputAmount: undefined,
    }));
  }, [defaultFormState, setUserFormState]);

  return [formState, handleChange, reverseTokens] as const;
}
