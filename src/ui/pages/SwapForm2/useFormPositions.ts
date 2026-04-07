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
  const { data } = useAssetListFungibles({
    fungibleIds: [fungibleId],
    currency,
  });
  return useMemo<FungiblePosition | null>(() => {
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
        iconUrl: networkConfig?.icon_url || '',
      },
    };
  }, [chainId, currency, data, networks]);
}

export function useFormPositions({
  formState,
  positions,
  networks,
}: {
  formState: SwapFormState2;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const inputExistingPosition: FungiblePosition | undefined = useMemo(() => {
    return positions.find(
      (p) =>
        p.chain.id === formState.inputChain &&
        p.fungible.id === formState.inputFungibleId
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
      (p) =>
        p.chain.id === formState.outputChain &&
        p.fungible.id === formState.outputFungibleId
    );
  }, [formState.outputChain, formState.outputFungibleId, positions]);

  const outputEmptyPosition = useEmptyPosition({
    chainId: formState.outputChain || '',
    fungibleId: formState.outputFungibleId || '',
    currency: useCurrency().currency,
    networks,
  });

  return useMemo(
    () => ({
      inputPosition: inputExistingPosition || inputEmptyPosition,
      outputPosition: outputExistingPosition || outputEmptyPosition,
    }),
    [
      inputExistingPosition,
      inputEmptyPosition,
      outputExistingPosition,
      outputEmptyPosition,
    ]
  );
}
