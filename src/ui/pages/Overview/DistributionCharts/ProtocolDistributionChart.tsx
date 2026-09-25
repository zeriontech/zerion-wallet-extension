import React, { useMemo, useState } from 'react';
import PieChartIcon from 'jsx:src/ui/assets/pie-chart.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletGroupedPositions } from 'src/modules/zerion-api/hooks/useWalletGroupedPositions';
import { usePreferences } from 'src/ui/features/preferences';
import {
  getAppPositions,
  getGrossPositionsValue,
} from 'src/ui/components/Positions/helpers';
import { DEFAULT_APP_ID } from 'src/ui/components/Positions/types';
import {
  DistributionChart,
  type DistributionItem,
} from 'src/ui/components/DistributionChart';
import { PositionsListDialog } from './PositionsListDialog';
import { DistributionItemTitle } from './DistributionItemTitle';

/**
 * DeFi protocol allocation on the Stats tab, one tile per App of the same
 * by-app request the Tokens tab makes. The Wallet Bucket (`wallet`) is
 * dropped — plain token holdings aren't a protocol, so the chart reflects
 * DeFi allocation only, with the remaining Apps re-normalized to 100% by the
 * shared chart. Each App is summed **gross** locally — loans are added, not
 * subtracted — so every tile area is positive, whatever the backend's own
 * (net) `value` says.
 */
export function ProtocolDistributionChart({ address }: { address: string }) {
  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();
  const source = useHttpClientSource();
  const { data, isLoading } = useWalletGroupedPositions(
    { addresses: [address], currency, groupBy: ['by-app'] },
    { source },
    { enabled: Boolean(address) }
  );

  const items = useMemo<DistributionItem[]>(
    () =>
      (data?.data?.apps ?? [])
        .filter((app) => app.app.id !== DEFAULT_APP_ID)
        .map((app) => ({
          id: app.app.id,
          label: app.app.name ?? app.app.id,
          value: getGrossPositionsValue(getAppPositions(app)),
          iconUrl: app.app.iconUrl ?? null,
        })),
    [data]
  );

  const [selected, setSelected] = useState<DistributionItem | null>(null);

  return (
    <>
      <DistributionChart
        title="DeFi Distribution"
        titleIcon={<PieChartIcon style={{ width: 24, height: 24 }} />}
        items={items}
        currency={currency}
        isLoading={isLoading}
        onSelect={setSelected}
        view={preferences?.protocolDistributionChartView ?? 'grid'}
        onViewChange={(view) =>
          setPreferences({ protocolDistributionChartView: view })
        }
      />
      <PositionsListDialog
        open={selected != null}
        onClose={() => setSelected(null)}
        address={address}
        title={selected ? <DistributionItemTitle item={selected} /> : null}
        filter={selected ? { type: 'protocol', appId: selected.id } : null}
      />
    </>
  );
}
