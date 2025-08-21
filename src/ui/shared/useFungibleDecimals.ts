import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getAssetImplementationInChain } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';

export function useFungibleDecimals({
  fungibleId,
  chain,
}: {
  fungibleId: string | null;
  chain: Chain | null;
}) {
  const { currency } = useCurrency();
  const approvalFungible = useAssetFullInfo(
    { currency, fungibleId: fungibleId || '' },
    { source: useHttpClientSource() },
    { enabled: Boolean(fungibleId) }
  );

  return useMemo(() => {
    const fungible = approvalFungible.data?.data.fungible;
    return fungible && chain
      ? getAssetImplementationInChain({
          asset: fungible,
          chain,
        })?.decimals
      : undefined;
  }, [chain, approvalFungible.data?.data.fungible]);
}
