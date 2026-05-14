import { useCallback, useMemo } from 'react';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { HandleChangeFunction, SendFormState2 } from './types';

const ETH_ID = 'eth';
const SOL_ID = '11111111111111111111111111111111';

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

  const handleChange = useCallback<HandleChangeFunction>(
    (key, value) => setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const selectFungible = useCallback(
    (chainId: string, fungibleId: string) => {
      setUserFormState((state) => ({
        ...state,
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
