import React, { useMemo, useState } from 'react';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import PieChartIcon from 'jsx:src/ui/assets/pie-chart.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { usePreferences } from 'src/ui/features/preferences';
import { groupPositionsByDapp } from 'src/ui/components/Positions/groupPositions';
import {
  DEFAULT_PROTOCOL_ID,
  DEFAULT_PROTOCOL_NAME,
} from 'src/ui/components/Positions/types';
import {
  DistributionChart,
  type DistributionItem,
} from 'src/ui/components/DistributionChart';
import { PositionsListDialog } from './PositionsListDialog';
import { DistributionItemTitle } from './DistributionItemTitle';

/**
 * Protocol allocation on the Stats tab. Backend positions carry `dapp`, so we
 * group by `dapp.id` (the no-dapp bucket is `wallet` / "Wallet"). Each group is
 * summed **gross** — loans are added, not subtracted — so every tile area is
 * positive (diverging from the positions view's net `getFullPositionsValue`).
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
    return Object.entries(groups).map(([dappId, groupPositions]) => {
      const value = groupPositions.reduce(
        (sum, position) => sum + (Number(position.value) || 0),
        0
      );
      const isWallet = dappId === DEFAULT_PROTOCOL_ID;
      const dapp = groupPositions.find((position) => position.dapp)?.dapp;
      return {
        id: dappId,
        label: isWallet ? DEFAULT_PROTOCOL_NAME : dapp?.name ?? dappId,
        value,
        iconUrl: isWallet ? null : dapp?.icon_url ?? null,
        iconNode: isWallet ? (
          <WalletIcon style={{ width: 24, height: 24 }} />
        ) : undefined,
      };
    });
  }, [data]);

  const [selected, setSelected] = useState<DistributionItem | null>(null);

  return (
    <>
      <DistributionChart
        title="Protocol Distribution"
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
