import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { reorderPinnedChains } from 'src/modules/ethereum/chains/helpers';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { usePreferences } from 'src/ui/features/preferences';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import DragIcon from 'jsx:src/ui/assets/drag.svg';
import UnpinIcon from 'jsx:src/ui/assets/unpin.svg';
import {
  usePinNetworkMutation,
  useSetPinnedNetworksMutation,
} from '../shared/PinNetworkButton';
import * as styles from './styles.module.css';

function SortableRow({
  network,
  onUnpin,
}: {
  network: NetworkInfo;
  onUnpin: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: network.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <div ref={setNodeRef} style={style} className={styles.row}>
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <Media
          vGap={0}
          image={
            <NetworkIcon size={24} src={network.iconUrl} name={network.name} />
          }
          text={<UIText kind="body/accent">{network.name}</UIText>}
          detailText={null}
        />
        <HStack gap={12} alignItems="center">
          <UnstyledButton
            type="button"
            onPointerDown={stop}
            onClick={(event) => {
              event.stopPropagation();
              onUnpin();
            }}
            title="Unpin network"
            style={{ display: 'flex', color: 'var(--neutral-400)' }}
          >
            <UnpinIcon style={{ width: 20, height: 20 }} />
          </UnstyledButton>
          <div
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            title="Drag to reorder"
          >
            <DragIcon />
          </div>
        </HStack>
      </HStack>
    </div>
  );
}

function PinnedNetworkListEdit({
  items,
  onReorder,
  onUnpin,
}: {
  items: NetworkInfo[];
  onReorder: (next: NetworkInfo[]) => void;
  onUnpin: (network: NetworkInfo) => void;
}) {
  const [localOrder, setLocalOrder] = useState(items);

  // Keep local order in sync when pins change outside of dragging
  useEffect(() => {
    const sameItems =
      localOrder.length === items.length &&
      localOrder.every((item, index) => item.id === items[index].id);
    if (!sameItems) {
      setLocalOrder(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const oldIndex = localOrder.findIndex((item) => item.id === active.id);
      const newIndex = localOrder.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(localOrder, oldIndex, newIndex);
      setLocalOrder(next);
      onReorder(next);
    },
    [localOrder, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localOrder.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <VStack gap={0}>
          {localOrder.map((network) => (
            <SortableRow
              key={network.id}
              network={network}
              onUnpin={() => onUnpin(network)}
            />
          ))}
        </VStack>
      </SortableContext>
    </DndContext>
  );
}

export function PinnedNetworks() {
  useBackgroundKind({ kind: 'white' });
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const testnetMode = Boolean(preferences?.testnetMode?.on);
  const { networks } = useNetworks();
  const items = useMemo(
    () =>
      networks
        ?.getPinnedNetworks('evm')
        .filter((network) => Boolean(network.testnet) === testnetMode) ?? [],
    [networks, testnetMode]
  );
  const { mutate: setPinned } = useSetPinnedNetworksMutation();
  const { mutate: togglePin } = usePinNetworkMutation();

  const handleReorder = useCallback(
    (next: NetworkInfo[]) => {
      if (!networks) return;
      setPinned(
        reorderPinnedChains(
          networks.getPinnedChainIds(),
          next.map((network) => network.id)
        )
      );
    },
    [networks, setPinned]
  );

  const handleUnpin = useCallback(
    (network: NetworkInfo) => {
      const isLast = items.length === 1;
      togglePin(
        { chain: network.id, pin: false },
        { onSuccess: isLast ? () => navigate(-1) : undefined }
      );
    },
    [items.length, navigate, togglePin]
  );

  if (!networks) {
    return <ViewLoading kind="network" />;
  }

  return (
    <PageColumn>
      <NavigationTitle title="Pinned Networks" />
      <PageTop />
      {items.length ? (
        <>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Drag to reorder. Pinned networks appear at the top of network
            selectors.
          </UIText>
          <Spacer height={8} />
          <PinnedNetworkListEdit
            items={items}
            onReorder={handleReorder}
            onUnpin={handleUnpin}
          />
        </>
      ) : (
        <UIText
          kind="body/regular"
          color="var(--neutral-500)"
          style={{ textAlign: 'center', paddingBlock: 24 }}
        >
          No pinned networks
        </UIText>
      )}
      <PageBottom />
    </PageColumn>
  );
}
