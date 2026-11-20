import { useMemo } from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import type { SwapFormState2 } from './types';

function useEmptyPosition({
  chainId,
  fungibleId,
  currency,
  networks,
}: {
  chainId: string;
  fungibleId: string;
  currency: string;
  networks: Networks;
}) {
  const { data, dataUpdatedAt } = useAssetListFungibles({
    fungibleIds: [fungibleId],
    currency,
  });
  const position = useMemo<FungiblePosition | null>(() => {
    const fungible = data?.data.at(0);
    if (!fungible || !fungible.implementations?.[chainId]) {
      return null;
    }
    const networkConfig = networks.getByNetworkId(createChain(chainId));

    return {
      id: `${chainId}-${fungible.id}-empty-position`,
      amount: {
        value: 0,
        currency,
        quantity: '0',
        usdValue: 0,
      },
      fungible,
      chain: {
        id: chainId,
        name: networkConfig?.name || '',
        iconUrl: networkConfig?.iconUrl || '',
      },
    };
  }, [chainId, currency, data, networks]);
  return { position, dataUpdatedAt };
}

export function useFormPositions({
  formState,
  positions,
  positionsUpdatedAt,
  networks,
}: {
  formState: SwapFormState2;
  positions: FungiblePosition[];
  positionsUpdatedAt: number;
  networks: Networks;
}) {
  const inputExistingPosition: FungiblePosition | undefined = useMemo(() => {
    return positions.find(
      (p) => p.chain.id === formState.inputChain && p.fungible.id === formState.inputFungibleId,
    );
  }, [formState.inputChain, formState.inputFungibleId, positions]);

  const inputEmptyPosition = useEmptyPosition({
    chainId: formState.inputChain,
    fungibleId: formState.inputFungibleId,
    currency: useCurrency().currency,
    networks,
  });

  const outputExistingPosition: FungiblePosition | undefined = useMemo(() => {
    return positions.find(
      (p) => p.chain.id === formState.outputChain && p.fungible.id === formState.outputFungibleId,
    );
  }, [formState.outputChain, formState.outputFungibleId, positions]);

  const outputEmptyPosition = useEmptyPosition({
    chainId: formState.outputChain,
    fungibleId: formState.outputFungibleId || '',
    currency: useCurrency().currency,
    networks,
  });

  return useMemo(
    () => ({
      inputPosition: inputExistingPosition || inputEmptyPosition.position,
      inputPriceUpdatedAt: inputExistingPosition
        ? positionsUpdatedAt
        : inputEmptyPosition.dataUpdatedAt,
      outputPosition: outputExistingPosition || outputEmptyPosition.position,
      outputPriceUpdatedAt: outputExistingPosition
        ? positionsUpdatedAt
        : outputEmptyPosition.dataUpdatedAt,
    }),
    [
      inputExistingPosition,
      inputEmptyPosition.position,
      inputEmptyPosition.dataUpdatedAt,
      outputExistingPosition,
      outputEmptyPosition.position,
      outputEmptyPosition.dataUpdatedAt,
      positionsUpdatedAt,
    ],
  );
}
