import React, { useMemo, useState } from 'react';
import PieChartIcon from 'jsx:src/ui/assets/pie-chart.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { usePreferences } from 'src/ui/features/preferences';
import { groupPositionsByDapp } from 'src/ui/components/Positions/groupPositions';
import { DEFAULT_PROTOCOL_ID } from 'src/ui/components/Positions/types';
import {
  DistributionChart,
  type DistributionItem,
} from 'src/ui/components/DistributionChart';
import { PositionsListDialog } from './PositionsListDialog';
import { DistributionItemTitle } from './DistributionItemTitle';

/**
 * DeFi protocol allocation on the Stats tab. Backend positions carry `dapp`, so
 * we group by `dapp.id` and drop the synthetic no-dapp bucket (`wallet`) — plain
 * token holdings aren't a protocol, so the chart reflects DeFi allocation only,
 * with the remaining protocols re-normalized to 100% by the shared chart. Each
 * group is summed **gross** — loans are added, not subtracted — so every tile
 * area is positive (diverging from the positions view's net
 * `getFullPositionsValue`).
 */
export function ProtocolDistributionChart({ address }: { address: string }) {
  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();
  const source = useHttpClientSource();
  const { data, isLoading } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source },
    { enabled: Boolean(address) }
  );

  const items = useMemo<DistributionItem[]>(() => {
    const positions = data?.data;
    if (!positions?.length) {
      return [];
    }
    const groups = groupPositionsByDapp(positions);
    return (
      Object.entries(groups)
        // Exclude the synthetic "Wallet" bucket (positions not in any dapp) so the
        // chart reflects DeFi protocol allocation only.
        .filter(([dappId]) => dappId !== DEFAULT_PROTOCOL_ID)
        .map(([dappId, groupPositions]) => {
          const value = groupPositions.reduce(
            (sum, position) => sum + (Number(position.value) || 0),
            0
          );
          const dapp = groupPositions.find((position) => position.dapp)?.dapp;
          return {
            id: dappId,
            label: dapp?.name ?? dappId,
            value,
            iconUrl: dapp?.icon_url ?? null,
          };
        })
    );
  }, [data]);

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
        filter={selected ? { type: 'protocol', dappId: selected.id } : null}
      />
    </>
  );
}
