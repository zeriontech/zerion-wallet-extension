import React, { useMemo, type ReactNode } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletGroupedPositions } from 'src/modules/zerion-api/hooks/useWalletGroupedPositions';
import { filterDisplayableApps } from 'src/ui/components/Positions/helpers';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PositionList } from '../Positions/Positions';

/**
 * Which distribution slice the dialog drills into. `network` keeps the chart's
 * chain id; `protocol` keeps the App id (the Wallet Bucket is
 * {DEFAULT_APP_ID}). A network slice is its own chain-scoped request (the one
 * the Tokens tab makes for that chain); an App slice is picked out of the
 * unfiltered by-app response.
 */
export type PositionsListFilter =
  | { type: 'network'; chainId: string }
  | { type: 'protocol'; appId: string };

function PositionsListDialogBody({
  address,
  filter,
}: {
  address: string;
  filter: PositionsListFilter;
}) {
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const { data, isLoading } = useWalletGroupedPositions(
    {
      addresses: [address],
      currency,
      groupBy: ['by-app'],
      chainIds: filter.type === 'network' ? [filter.chainId] : undefined,
    },
    { source },
    { enabled: Boolean(address) }
  );

  const apps = useMemo(() => {
    const displayable = filterDisplayableApps(data?.data?.apps ?? []);
    return filter.type === 'network'
      ? displayable
      : displayable.filter((app) => app.app.id === filter.appId);
  }, [data, filter]);

  if (isLoading) {
    return (
      <VStack gap={0} style={{ padding: 24, justifyItems: 'center' }}>
        <ViewLoading />
      </VStack>
    );
  }

  if (!apps.length) {
    return (
      <UIText
        kind="body/regular"
        color="var(--neutral-600)"
        style={{ padding: 24, textAlign: 'center' }}
      >
        No positions
      </UIText>
    );
  }

  return (
    <PositionList
      apps={apps}
      address={address}
      moveGasPositionToFront={filter.type === 'network'}
      dappChain={filter.type === 'network' ? filter.chainId : null}
      stickyOffset={0}
    />
  );
}

/**
 * A {Dialog2} listing the positions behind a single distribution-chart tile,
 * reusing the Overview {PositionList} (grouped by App, same rows/links). The
 * caller drives `open`/`onClose`; `filter` decides what the list is scoped to.
 */
export function PositionsListDialog({
  open,
  onClose,
  address,
  title,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
  title: ReactNode;
  filter: PositionsListFilter | null;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title={title}
      titleAlign="start"
      size="content"
      style={{ maxHeight: '80vh' }}
    >
      {open && filter ? (
        <VStack gap={0} style={{ paddingBottom: 24 }}>
          <PositionsListDialogBody address={address} filter={filter} />
        </VStack>
      ) : null}
    </Dialog2>
  );
}
