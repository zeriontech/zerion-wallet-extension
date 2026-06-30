import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { HandleChangeFunction, SendFormState2 } from './types';

const ETH_ID = 'eth';
const SOL_ID = '11111111111111111111111111111111';

/**
 * Network-fee overrides are bound to a specific chain + prepared transaction.
 * When the selected fungible/NFT (and thus the chain or tx) changes, the send
 * is re-prepared against new params, so any user-entered gas overrides (speed,
 * fees, gas price/limit) no longer apply and must be cleared.
 */
const CLEARED_GAS_OVERRIDES: Pick<
  SendFormState2,
  'networkFeeSpeed' | 'maxPriorityFee' | 'maxFee' | 'gasPrice' | 'gasLimit'
> = {
  networkFeeSpeed: undefined,
  maxPriorityFee: undefined,
  maxFee: undefined,
  gasPrice: undefined,
  gasLimit: undefined,
};

function useDefaultFormState({
  address,
  positions,
}: {
  address: string;
  positions: FungiblePosition[];
}): SendFormState2 {
  return useMemo(() => {
    const biggest = [...positions]
      .filter((p) => p.amount.value)
      .sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0))[0];

    if (biggest) {
      return {
        inputChain: biggest.chain.id,
        inputFungibleId: biggest.fungible.id,
      };
    }

    return getAddressType(address) === 'evm'
      ? { inputChain: NetworkId.Ethereum, inputFungibleId: ETH_ID }
      : { inputChain: NetworkId.Solana, inputFungibleId: SOL_ID };
  }, [address, positions]);
}

export function useFormState({
  address,
  positions,
}: {
  address: string;
  positions: FungiblePosition[];
}) {
  const [userFormState, setUserFormState] =
    useSearchParamsObj<SendFormState2>();

  const defaultFormState = useDefaultFormState({ address, positions });

  const formState = useMemo(
    () => ({ ...defaultFormState, ...userFormState }),
    [defaultFormState, userFormState]
  );

  // Pin the resolved input defaults into the URL so the displayed asset stays
  // stable for the session. Without this, `defaultFormState` is recomputed from
  // positions on every balance refetch; a fresh snapshot can shift the
  // highest-value position so the selected asset changes underfoot — and after
  // a send completes the cleared form would resolve to the new highest-value
  // asset instead of the one the user just sent. Only fills missing keys; never
  // overwrites an existing URL value. Mirrors SwapForm2's useFormState.
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

  const selectFungible = useCallback(
    (chainId: string, fungibleId: string) => {
      setUserFormState((state) => ({
        ...state,
        ...CLEARED_GAS_OVERRIDES,
        inputChain: chainId,
        inputFungibleId: fungibleId,
        nftId: undefined,
        nftAmount: undefined,
      }));
    },
    [setUserFormState]
  );

  const selectNft = useCallback(
    (nftId: string, chainId: string) => {
      setUserFormState((state) => ({
        ...state,
        ...CLEARED_GAS_OVERRIDES,
        nftId,
        inputChain: chainId,
        inputFungibleId: undefined,
        inputAmount: undefined,
        inputKind: undefined,
      }));
    },
    [setUserFormState]
  );

  return [
    formState,
    handleChange,
    setUserFormState,
    selectFungible,
    selectNft,
  ] as const;
}
