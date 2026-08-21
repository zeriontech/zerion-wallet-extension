import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { useDepositSuggestedTokens } from 'src/modules/zerion-api/hooks/useDepositSuggestedTokens';
import type {
  DepositQuote,
  OnrampAsset,
} from 'src/modules/zerion-api/types/DepositFlow';
import { getOnrampEcosystem } from './ecosystem';

export interface OutputAssetPreview {
  symbol: string;
  iconUrl: string | null;
  chainName: string;
  chainIconUrl: string | null;
}

function fromOnrampAsset(asset: OnrampAsset): OutputAssetPreview {
  return {
    symbol: asset.asset.symbol,
    iconUrl: asset.asset.iconUrl,
    chainName: asset.chain.name,
    chainIconUrl: asset.chain.iconUrl,
  };
}

/**
 * Just enough of the chosen token to draw the "Receive" row: icon, symbol, and
 * the same for its chain. Deliberately three sources in precedence order,
 * because no single one covers every way this page can be reached.
 */
export function useOutputAssetPreview({
  address,
  outputFungibleId,
  outputChain,
  quote,
}: {
  address: string;
  outputFungibleId: string | undefined;
  outputChain: string | undefined;
  quote: DepositQuote | null;
}): OutputAssetPreview | null {
  const { networks } = useNetworks();
  const { currency } = useCurrency();

  // Covers arriving from the featured tile or the popular list, which is the
  // common path — and it is already cached from the picker
  const suggestedTokensQuery = useDepositSuggestedTokens({
    ecosystem: getOnrampEcosystem(address),
  });

  // Covers a cold load of a token the user found by searching, which is in
  // neither list above. This is what the web app relies on exclusively.
  // `currency` is nominally optional but the endpoint 400s without it, and it
  // is skipped entirely until the default asset id resolves
  const shouldLookUpFungible = Boolean(outputFungibleId);
  const fungiblesQuery = useAssetListFungibles(
    { fungibleIds: outputFungibleId ? [outputFungibleId] : [], currency },
    { suspense: false, enabled: shouldLookUpFungible }
  );

  return useMemo(() => {
    if (!outputFungibleId || !outputChain) {
      return null;
    }

    // The quote is authoritative: it echoes back the asset and chain the
    // provider actually priced
    if (quote && quote.asset.id === outputFungibleId) {
      return fromOnrampAsset({ asset: quote.asset, chain: quote.chain });
    }

    const data = suggestedTokensQuery.data?.data;
    const match = [
      ...(data?.featuredAssets ?? []),
      ...(data?.assets ?? []),
    ].find(
      (item) =>
        item.asset.id === outputFungibleId && item.chain.id === outputChain
    );
    if (match) {
      return fromOnrampAsset(match);
    }

    const network = networks?.getByNetworkId(createChain(outputChain));
    const fungible = shouldLookUpFungible
      ? fungiblesQuery.data?.data.find((item) => item.id === outputFungibleId)
      : undefined;
    if (fungible) {
      return {
        symbol: fungible.symbol,
        iconUrl: fungible.iconUrl,
        // The deposit endpoints know chains the wallet's registry may not, so
        // fall back to the raw id rather than rendering nothing
        chainName: network?.name ?? outputChain,
        chainIconUrl: network?.icon_url ?? null,
      };
    }
    return null;
  }, [
    outputFungibleId,
    outputChain,
    quote,
    suggestedTokensQuery.data,
    fungiblesQuery.data,
    shouldLookUpFungible,
    networks,
  ]);
}
