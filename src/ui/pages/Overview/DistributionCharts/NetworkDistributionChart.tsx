import React, { useMemo, useState } from 'react';
import NetworkIcon from 'jsx:src/ui/assets/all-networks.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { usePreferences } from 'src/ui/features/preferences';
import {
  DistributionChart,
  HARDCODED_CHAIN_ACCENTS,
  type DistributionItem,
} from 'src/ui/components/DistributionChart';
import { PositionsListDialog } from './PositionsListDialog';
import { DistributionItemTitle } from './DistributionItemTitle';

/**
 * Network allocation on the Stats tab. Source is the ready-made
 * `positionsChainsDistribution` record — fiat value per chain in the active
 * currency — so nothing is re-derived from positions. Name + icon come from
 * the same portfolio response's `chains` map.
 */
export function NetworkDistributionChart({ address }: { address: string }) {
  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();
  const source = useHttpClientSource();
  const { data, isLoading } = useWalletPortfolio(
    { addresses: [address], currency },
    { source },
    { enabled: Boolean(address), refetchInterval: 40000 }
  );

  const items = useMemo<DistributionItem[]>(() => {
    const portfolio = data?.data;
    if (!portfolio) {
      return [];
    }
    const { positionsChainsDistribution, chains } = portfolio;
    return Object.entries(positionsChainsDistribution)
      .filter(([, value]) => value > 0)
      .map(([chainId, value]) => {
        const chain = chains?.[chainId];
        return {
          id: chainId,
          label: chain?.name ?? chainId,
          value,
          iconUrl: chain?.iconUrl ?? null,
          accent: HARDCODED_CHAIN_ACCENTS[chainId],
        };
      });
  }, [data]);

  const [selected, setSelected] = useState<DistributionItem | null>(null);

  return (
    <>
      <DistributionChart
        title="Network Distribution"
        titleIcon={<NetworkIcon style={{ width: 24, height: 24 }} />}
        items={items}
        currency={currency}
        isLoading={isLoading}
        onSelect={setSelected}
        view={preferences?.networkDistributionChartView ?? 'grid'}
        onViewChange={(view) =>
          setPreferences({ networkDistributionChartView: view })
        }
      />
      <PositionsListDialog
        open={selected != null}
        onClose={() => setSelected(null)}
        address={address}
        title={selected ? <DistributionItemTitle item={selected} /> : null}
        filter={selected ? { type: 'network', chainId: selected.id } : null}
      />
    </>
  );
}
