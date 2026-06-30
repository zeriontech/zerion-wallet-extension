import React, { useMemo, type ReactNode } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { DEFAULT_PROTOCOL_ID } from 'src/ui/components/Positions/types';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PositionList } from '../Positions/Positions';

/**
 * Which distribution slice the dialog drills into. `network` keeps the chart's
 * chain id; `protocol` keeps the `dapp.id` (the no-dapp bucket is
 * {DEFAULT_PROTOCOL_ID}). The two map to different {PositionList} props.
 */
export type PositionsListFilter =
  | { type: 'network'; chainId: string }
  | { type: 'protocol'; dappId: string };

function PositionsListDialogBody({
  address,
  filter,
}: {
  address: string;
  filter: PositionsListFilter;
}) {
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const { data, isLoading } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source },
    { enabled: Boolean(address) }
  );

  const items = useMemo(() => {
    const positions = data?.data;
    if (!positions?.length) {
      return [];
    }
    return positions.filter((position) => {
      const displayable =
        position.type === 'asset' ? position.is_displayable : true;
      if (!displayable) {
        return false;
      }
      return filter.type === 'network'
        ? position.chain === filter.chainId
        : (position.dapp?.id || DEFAULT_PROTOCOL_ID) === filter.dappId;
    });
  }, [data, filter]);

  if (isLoading) {
    return (
      <VStack gap={0} style={{ padding: 24, justifyItems: 'center' }}>
        <ViewLoading />
      </VStack>
    );
  }

  if (!items.length) {
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
      items={items}
      address={address}
      moveGasPositionToFront={filter.type === 'network'}
      dappChain={filter.type === 'network' ? filter.chainId : null}
      isAllNetworks={filter.type === 'protocol'}
      stickyOffset={0}
    />
  );
}

/**
 * A {Dialog2} listing the positions behind a single distribution-chart tile,
 * reusing the Overview {PositionList} (grouped by dapp, same rows/links). The
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
