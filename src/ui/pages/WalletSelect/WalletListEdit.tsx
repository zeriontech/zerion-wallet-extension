import React, { useCallback, useEffect, useRef } from 'react';
import { useState, useMemo } from 'react';
import type {
  CollisionDetection,
  UniqueIdentifier,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from '@dnd-kit/core';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { middot, NBSP } from 'src/ui/shared/typography';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import type { WalletListGroup } from 'src/shared/wallet/wallet-list';
import { getWalletId } from 'src/shared/wallet/wallet-list';
import { useEvent } from 'src/ui/shared/useEvent';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import DragIcon from 'jsx:src/ui/assets/drag.svg';
import * as styles from './styles.module.css';
import type { AnyWallet, WalletGroupInfo } from './shared';
import { getFullWalletList } from './shared';

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0]
  );

  return newArray;
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

function DroppableContainer({
  children,
  id,
  items,
}: React.PropsWithChildren<{ id: string; items: string[] }>) {
  const { transform, setNodeRef } = useSortable({
    id,
    data: {
      type: 'container',
      children: items,
    },
    animateLayoutChanges,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        paddingBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function WalletListEditItem({
  wallet,
  groupId,
}: {
  wallet: ExternallyOwnedAccount;
  groupId: string;
}) {
  const { currency } = useCurrency();
  const ecosystemPrefix =
    getAddressType(wallet.address) === 'evm' ? 'Eth' : 'Sol';

  return (
    <div
      className={styles.wallet}
      style={{
        borderRadius: 20,
        width: '100%',
        marginBlock: 4,
        backgroundColor: 'var(--white)',
      }}
    >
      <VStack gap={0}>
        <HStack
          gap={4}
          justifyContent="space-between"
          alignItems="center"
          style={{ padding: 12 }}
        >
          <Media
            vGap={0}
            image={
              <WalletAvatar
                address={wallet.address}
                size={40}
                active={false}
                borderRadius={12}
                icon={
                  <WalletSourceIcon
                    address={wallet.address}
                    groupId={groupId}
                    style={{ width: 16, height: 16 }}
                  />
                }
              />
            }
            text={
              <UIText kind="small/regular">
                <WalletDisplayName
                  wallet={wallet}
                  render={(data) => (
                    <span
                      style={{
                        wordBreak: 'break-all',
                        verticalAlign: 'middle',
                      }}
                    >
                      {`${
                        data.type !== WalletNameType.domain
                          ? `${ecosystemPrefix} ${middot} `
                          : ''
                      }${data.value}`}
                    </span>
                  )}
                />
              </UIText>
            }
            detailText={
              <PortfolioValue
                address={wallet.address}
                render={(query) => (
                  <UIText kind="headline/h3" style={{ display: 'flex' }}>
                    {query.data ? (
                      <BlurrableBalance kind="headline/h3" color="var(--black)">
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            query.data.data?.totalValue || 0,
                            'en',
                            currency
                          )}
                        />
                      </BlurrableBalance>
                    ) : (
                      NBSP
                    )}
                  </UIText>
                )}
              />
            }
          />
          <HStack gap={12} alignItems="center">
            <UnstyledLink
              to={`/wallets/accounts/${wallet.address}?groupId=${groupId}`}
              style={{ display: 'flex' }}
              title="Edit wallet"
            >
              <DotsIcon />
            </UnstyledLink>
            <DragIcon style={{ color: 'var(--neutral-500)' }} />
          </HStack>
        </HStack>
      </VStack>
    </div>
  );
}

function DraggableWalletItem({
  walletId,
  wallet,
  groupId,
}: {
  walletId: string;
  wallet: ExternallyOwnedAccount;
  groupId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: walletId });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WalletListEditItem wallet={wallet} groupId={groupId} />
    </div>
  );
}

function WalletListEditInner({
  groups: defaultGroups,
  walletMap,
  onChange,
}: {
  groups: WalletListGroup[];
  walletMap: Map<string, { group: WalletGroupInfo; wallet: AnyWallet }>;
  onChange: (newOrder: WalletListGroup[]) => void;
}) {
  const [groups] = useState<WalletListGroup[]>(defaultGroups);
  const [items, setItems] = useState<Record<string, string[]>>(() =>
    groups.reduce(
      (acc, group) => ({ ...acc, [group.id]: group.walletIds }),
      {} as Record<string, string[]>
    )
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      if (id in items) {
        return id;
      }

      return Object.keys(items).find((key) =>
        items[key].includes(id as string)
      );
    },
    [items]
  );

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in items) {
          const containerItems = items[overId];

          // If container is empty, keep the container as the overId
          if (containerItems.length > 0) {
            // Find the closest item in the container
            const closestItem = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.includes(container.id as string)
              ),
            })[0]?.id;

            // Only use the closest item if found, otherwise keep container id
            if (closestItem) {
              overId = closestItem;
            }
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      const overId = over?.id;

      if (overId == null || active.id in items) {
        return;
      }

      // Determine if overId is a container or an item
      const isOverContainer = overId in items;
      const overContainer = isOverContainer
        ? (overId as string)
        : findContainer(overId);
      const activeContainer = findContainer(active.id);

      if (!overContainer || !activeContainer) {
        return;
      }

      if (activeContainer !== overContainer) {
        setItems((items) => {
          const activeItems = items[activeContainer as string];
          const overItems = items[overContainer as string];
          const activeIndex = activeItems.indexOf(active.id as string);

          let newIndex: number;

          if (isOverContainer) {
            // Dropping into an empty container or at the end
            newIndex = overItems.length;
          } else {
            // Dropping over an item
            const overIndex = overItems.indexOf(overId as string);
            const isBelowOverItem =
              over &&
              active.rect.current.translated &&
              active.rect.current.translated.top >
                over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;

            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
          }

          recentlyMovedToNewContainer.current = true;

          return {
            ...items,
            [activeContainer]: items[activeContainer as string].filter(
              (item) => item !== active.id
            ),
            [overContainer]: [
              ...items[overContainer as string].slice(0, newIndex),
              items[activeContainer as string][activeIndex],
              ...items[overContainer as string].slice(
                newIndex,
                items[overContainer as string].length
              ),
            ],
          };
        });
      }
    },
    [findContainer, items]
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (active.id in items && over?.id) {
        setActiveId(null);
        return;
      }

      const activeContainer = findContainer(active.id);

      if (!activeContainer) {
        setActiveId(null);
        return;
      }

      const overId = over?.id;

      if (overId == null) {
        setActiveId(null);
        return;
      }

      const isOverContainer = overId in items;
      const overContainer = isOverContainer
        ? (overId as string)
        : findContainer(overId);

      if (overContainer && activeContainer === overContainer) {
        // Reordering within the same container
        const activeIndex = items[activeContainer as string].indexOf(
          active.id as string
        );
        const overIndex = items[overContainer as string].indexOf(
          overId as string
        );

        if (activeIndex !== overIndex && overIndex !== -1) {
          setItems((items) => ({
            ...items,
            [overContainer]: arrayMove(
              items[overContainer as string],
              activeIndex,
              overIndex
            ),
          }));
        }
      }
      // Note: Cross-container moves are already handled by handleDragOver

      setActiveId(null);
    },
    [findContainer, items]
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  const onChangeEvent = useEvent(onChange);

  useEffect(() => {
    const newOrder = groups.map((group) => ({
      id: group.id,
      title: group.title,
      walletIds: items[group.id] || [],
    }));
    onChangeEvent(newOrder);
  }, [items, groups, onChangeEvent]);

  const activeWallet = useMemo(() => {
    if (!activeId) return null;
    const item = walletMap.get(activeId);
    return item || null;
  }, [activeId, walletMap]);

  // Get all container IDs and all item IDs for the top-level context
  const allIds = useMemo(() => {
    const containerIds = Object.keys(items);
    const itemIds = Object.values(items).flat();
    return [...containerIds, ...itemIds];
  }, [items]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <VStack gap={0}>
          {groups.map((group) => (
            <DroppableContainer
              key={group.id}
              id={group.id}
              items={items[group.id] || []}
            >
              <VStack gap={2}>
                <UIText
                  kind="small/accent"
                  color="var(--neutral-700)"
                  style={{ paddingLeft: 4, paddingTop: 12 }}
                >
                  {group.title}
                </UIText>
                <SortableContext
                  items={items[group.id] || []}
                  strategy={verticalListSortingStrategy}
                >
                  {items[group.id]?.length ? (
                    <VStack gap={0}>
                      {items[group.id].map((walletId) => {
                        const item = walletMap.get(walletId);
                        if (!item) return null;
                        return (
                          <DraggableWalletItem
                            key={walletId}
                            walletId={walletId}
                            wallet={item.wallet}
                            groupId={item.group.id}
                          />
                        );
                      })}
                    </VStack>
                  ) : (
                    <VStack
                      gap={0}
                      style={{
                        minHeight: 60,
                        borderRadius: 12,
                        backgroundColor: 'var(--neutral-100)',
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UIText
                        kind="small/regular"
                        color="var(--neutral-500)"
                        style={{ textAlign: 'center' }}
                      >
                        Drop wallets here
                      </UIText>
                    </VStack>
                  )}
                </SortableContext>
              </VStack>
            </DroppableContainer>
          ))}
        </VStack>
      </SortableContext>
      <DragOverlay>
        {activeWallet ? (
          <WalletListEditItem
            wallet={activeWallet.wallet}
            groupId={activeWallet.group.id}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function WalletListEdit({
  walletsOrder,
  walletGroups,
  onChange,
}: {
  walletsOrder?: WalletListGroup[];
  walletGroups: WalletGroupInfo[];
  onChange: (newOrder: WalletListGroup[]) => void;
}) {
  const groups = useMemo(
    () =>
      getFullWalletList({
        walletsOrder,
        walletGroups,
        filterEmptyGroups: false,
      }),
    [walletsOrder, walletGroups]
  );
  const walletMap = useMemo(() => {
    const map = new Map<
      string,
      { group: WalletGroupInfo; wallet: AnyWallet }
    >();
    for (const group of walletGroups) {
      for (const wallet of group.walletContainer.wallets) {
        map.set(
          getWalletId({
            address: wallet.address,
            groupId: group.id,
          }),
          { group, wallet }
        );
      }
    }
    return map;
  }, [walletGroups]);

  return (
    <WalletListEditInner
      groups={groups}
      walletMap={walletMap}
      onChange={onChange}
    />
  );
}
