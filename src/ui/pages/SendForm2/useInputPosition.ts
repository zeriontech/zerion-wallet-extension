import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { useAddressPositionsFromNode2 } from 'src/ui/shared/requests/useAddressPositionsFromNode2';
import type { SendFormState2 } from './types';

export function useInputPosition({
  address,
  formState,
  positions,
  networks,
}: {
  address: string;
  formState: SendFormState2;
  positions: FungiblePosition[];
  networks: Networks;
}): { position: FungiblePosition | null; isLoading: boolean } {
  const { currency } = useCurrency();
  const { inputChain, inputFungibleId } = formState;

  const networkConfig = useMemo(
    () =>
      inputChain
        ? networks.getByNetworkId(createChain(inputChain)) ?? null
        : null,
    [inputChain, networks]
  );
  const supportsPositions = networkConfig?.supports_positions ?? true;

  const simpleMatch = useMemo(() => {
    if (!inputChain || !inputFungibleId) return null;
    return (
      positions.find(
        (p) => p.chain.id === inputChain && p.fungible.id === inputFungibleId
      ) ?? null
    );
  }, [positions, inputChain, inputFungibleId]);

  const nodeQuery = useAddressPositionsFromNode2({
    address,
    chain: createChain(inputChain ?? ''),
    currency,
    enabled: Boolean(inputChain) && !supportsPositions && !simpleMatch,
  });
  const nodeMatch = useMemo(() => {
    if (simpleMatch) return null;
    if (!inputFungibleId) return null;
    return (
      nodeQuery.data?.find((p) => p.fungible.id === inputFungibleId) ?? null
    );
  }, [nodeQuery.data, simpleMatch, inputFungibleId]);

  const needsSynthetic = Boolean(
    inputFungibleId &&
      !simpleMatch &&
      !nodeMatch &&
      (supportsPositions || !nodeQuery.isLoading)
  );
  const fungibleQuery = useAssetListFungibles(
    inputFungibleId
      ? { fungibleIds: [inputFungibleId], currency }
      : { currency }
  );

  const syntheticPosition = useMemo<FungiblePosition | null>(() => {
    if (!needsSynthetic || !networkConfig) return null;
    const fungible = fungibleQuery.data?.data?.[0];
    if (!fungible) return null;
    return {
      id: `${inputChain}-${inputFungibleId}-empty`,
      amount: {
        currency,
        quantity: '0',
        value: null,
        usdValue: null,
      },
      fungible,
      chain: {
        id: inputChain!,
        name: networkConfig.name,
        iconUrl: networkConfig.icon_url ?? '',
      },
    };
  }, [
    needsSynthetic,
    networkConfig,
    fungibleQuery.data,
    inputChain,
    inputFungibleId,
    currency,
  ]);

  const position = simpleMatch ?? nodeMatch ?? syntheticPosition ?? null;

  const isLoading =
    (!supportsPositions && nodeQuery.isLoading) ||
    (needsSynthetic && fungibleQuery.isLoading);

  return { position, isLoading };
}
