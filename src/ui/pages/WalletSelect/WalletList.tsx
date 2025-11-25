import React, { useId, useMemo, useRef, useState } from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { middot, NBSP } from 'src/ui/shared/typography';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import { CopyButton } from 'src/ui/components/CopyButton';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import {
  DEFAULT_WALLET_LIST_GROUP_ID,
  DEFAULT_WALLET_LIST_GROUPS,
  getWalletId,
  WATCHLIST_WALLET_LIST_GROUP_ID,
  type WalletListGroup,
} from 'src/shared/wallet/wallet-list';
import { useEvent } from 'src/ui/shared/useEvent';
import { isTruthy } from 'is-truthy-ts';
import { isReadonlyAccount } from 'src/shared/types/validators';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import * as styles from './styles.module.css';

function WalletListItem({
  wallet,
  groupId,
  showAddressValues,
  useCssAnchors,
  isSelected,
  renderFooter,
  ...buttonProps
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  wallet: ExternallyOwnedAccount;
  groupId: string;
  showAddressValues: boolean;
  useCssAnchors: boolean;
  isSelected: boolean;
  renderFooter: (() => React.ReactNode) | null;
}) {
  const id = useId();
  const { currency } = useCurrency();
  // colons are invalid for anchor-name CSS property
  const anchorName = `--button-slot-${id.replaceAll(':', '')}`;
  const COPY_BUTTON_SIZE = 20;
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);
  const copyButton = (
    <CopyButton
      title="Copy Address"
      textToCopy={wallet.address}
      onClick={(event) => {
        if (!useCssAnchors) {
          event.stopPropagation();
        }
      }}
      buttonRef={copyButtonRef}
      size={16}
      btnStyle={{
        padding: 0,
        display: 'block',
        ['--button-text' as string]:
          'var(--copy-button-text-color, var(--neutral-500))',
      }}
      tooltipPosition="center-bottom"
      tooltipContent="Address Copied"
      style={{
        verticalAlign: 'middle',
        ...(useCssAnchors
          ? {
              position: 'absolute',
              ['positionAnchor' as string]: anchorName,
              ['positionArea' as string]: 'center',
            }
          : undefined),
      }}
    />
  );
  const ecosystemPrefix =
    getAddressType(wallet.address) === 'evm' ? 'Eth' : 'Sol';

  return (
    <>
      <UnstyledButton
        className={styles.wallet}
        style={{
          borderRadius: 20,
          width: '100%',
          marginBlock: 4,
        }}
        {...buttonProps}
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
                <IsConnectedToActiveTab
                  address={wallet.address}
                  render={({ data: isConnected }) => (
                    <WalletAvatar
                      address={wallet.address}
                      size={40}
                      active={Boolean(isConnected)}
                      borderRadius={12}
                      icon={
                        <WalletSourceIcon
                          address={wallet.address}
                          groupId={groupId}
                          style={{ width: 16, height: 16 }}
                        />
                      }
                    />
                  )}
                />
              }
              text={
                <UIText kind="small/regular">
                  <WalletDisplayName
                    wallet={wallet}
                    render={(data) => (
                      <>
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
                        {showAddressValues &&
                        data.type !== WalletNameType.address ? (
                          <>
                            <span
                              className={styles.addressHint}
                              style={{
                                color: 'var(--neutral-500)',
                                verticalAlign: 'middle',
                              }}
                              onClick={(event) => {
                                /**
                                 * This is only a helper to invoke click of the CopyButton
                                 * when the address value is clicked. Therefore it's okay to
                                 * put onClick on the span here as screenreader and keyboard users
                                 * will be able to interact with the actual copy button.
                                 * The reason not to put text inside the CopyButton is that when using
                                 * CSS Anchors we cannot make the anchored element wrap to the new line
                                 * when there's not enough space for it in the slot.
                                 */
                                if (copyButtonRef.current) {
                                  event.stopPropagation();
                                  copyButtonRef.current.click();
                                }
                              }}
                            >
                              {` · ${truncateAddress(wallet.address, 5)}`}
                            </span>
                          </>
                        ) : null}{' '}
                        {useCssAnchors ? (
                          <span
                            // This is a "slot" where copyButton will visually appear
                            style={{
                              display: 'inline-block',
                              width: COPY_BUTTON_SIZE,
                              height: COPY_BUTTON_SIZE,
                              ['anchorName' as string]: anchorName,
                              verticalAlign: 'bottom',
                            }}
                          ></span>
                        ) : (
                          copyButton
                        )}
                      </>
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
                        <BlurrableBalance
                          kind="headline/h3"
                          color="var(--black)"
                        >
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
            {isSelected ? (
              <CheckIcon style={{ width: 24, height: 24 }} />
            ) : null}
          </HStack>
          {renderFooter ? renderFooter() : null}
        </VStack>
      </UnstyledButton>
      {useCssAnchors ? copyButton : null}
    </>
  );
}

type AnyWallet = ExternallyOwnedAccount | BareWallet | DeviceAccount;

interface WalletGroupInfo {
  id: string;
  walletContainer: {
    wallets: AnyWallet[];
  };
}

type WalletListGroupInfo = {
  id: string;
  title: string;
  items: { group: WalletGroupInfo; wallet: AnyWallet }[];
};

function getWalletItems({
  walletsOrder,
  walletGroups,
  predicate,
}: {
  walletsOrder: WalletListGroup[];
  walletGroups: WalletGroupInfo[];
  predicate?: (item: AnyWallet) => boolean;
}): WalletListGroupInfo[] {
  const walletMap = new Map<
    string,
    { group: WalletGroupInfo; wallet: AnyWallet }
  >();
  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      if (predicate && !predicate(wallet)) {
        continue;
      }
      const walletId = getWalletId({
        address: wallet.address,
        groupId: group.id,
      });
      walletMap.set(walletId, { group, wallet });
    }
  }
  const usedWalletIds = new Set<string>();
  const result: WalletListGroupInfo[] = walletsOrder.map((group) => ({
    id: group.id,
    title: group.title,
    items: group.walletIds
      .map((walletId) => {
        const item = walletMap.get(walletId);
        if (item) {
          usedWalletIds.add(walletId);
          return item;
        }
        return null;
      })
      .filter(isTruthy),
  }));

  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      if (predicate && !predicate(wallet)) {
        continue;
      }
      const walletId = getWalletId({
        address: wallet.address,
        groupId: group.id,
      });
      if (usedWalletIds.has(walletId)) {
        continue;
      }
      const isReadonly = isReadonlyAccount(wallet);
      const targetWalletGroup = isReadonly
        ? WATCHLIST_WALLET_LIST_GROUP_ID
        : DEFAULT_WALLET_LIST_GROUP_ID;
      result
        .find((g) => g.id === targetWalletGroup)
        ?.items.push({ group, wallet });
    }
  }

  return result.filter((group) => group.items.length > 0);
}

const alwaysTrue = () => true;

export function WalletList({
  walletsOrder = DEFAULT_WALLET_LIST_GROUPS,
  walletGroups,
  selectedAddress,
  showAddressValues,
  renderItemFooter,
  onSelect,
  predicate = alwaysTrue,
}: {
  walletsOrder?: WalletListGroup[];
  walletGroups: WalletGroupInfo[];
  selectedAddress: string;
  showAddressValues: boolean;
  renderItemFooter?: ({
    group,
    wallet,
  }: {
    group: WalletGroupInfo;
    wallet: AnyWallet;
  }) => React.ReactNode;
  onSelect(wallet: AnyWallet): void;
  predicate?: (item: AnyWallet) => boolean;
}) {
  const predicateEvent = useEvent(predicate);
  const groups = useMemo(
    () =>
      getWalletItems({ walletsOrder, walletGroups, predicate: predicateEvent }),
    [walletsOrder, walletGroups, predicateEvent]
  );
  /**
   * If CSS anchor positioning is supported, we use it to avoid
   * nesting buttons, which is invalid per html spec, but still works ¯\_(ツ)_/¯
   */
  const supportsCssAnchor = CSS.supports('anchor-name: --name');

  return (
    <VStack gap={4}>
      {groups.map((group) => (
        <VStack key={group.id} gap={2}>
          <UIText
            kind="small/accent"
            color="var(--neutral-700)"
            style={{ paddingLeft: 4, paddingTop: 12 }}
          >
            {group.title}
          </UIText>
          <VStack gap={0}>
            {group.items.map(({ group, wallet }) => {
              const key = getWalletId({
                address: wallet.address,
                groupId: group.id,
              });
              return (
                <WalletListItem
                  key={key}
                  onClick={() => onSelect(wallet)}
                  wallet={wallet}
                  groupId={group.id}
                  useCssAnchors={supportsCssAnchor}
                  showAddressValues={showAddressValues}
                  isSelected={
                    normalizeAddress(wallet.address) ===
                    normalizeAddress(selectedAddress)
                  }
                  renderFooter={
                    renderItemFooter
                      ? () => renderItemFooter({ group, wallet })
                      : null
                  }
                />
              );
            })}
          </VStack>
        </VStack>
      ))}
    </VStack>
  );
}

function DragIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path
        d="M8 6H16M8 12H16M8 18H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
              <IsConnectedToActiveTab
                address={wallet.address}
                render={({ data: isConnected }) => (
                  <WalletAvatar
                    address={wallet.address}
                    size={40}
                    active={Boolean(isConnected)}
                    borderRadius={12}
                    icon={
                      <WalletSourceIcon
                        address={wallet.address}
                        groupId={groupId}
                        style={{ width: 16, height: 16 }}
                      />
                    }
                  />
                )}
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
          <DragIcon style={{ color: 'var(--neutral-500)' }} />
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
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WalletListEditItem wallet={wallet} groupId={groupId} />
    </div>
  );
}

function WalletListEditInner({
  groups,
  walletsOrder,
  onChange,
}: {
  groups: WalletListGroupInfo[];
  walletsOrder: WalletListGroup[];
  onChange: (newOrder: WalletListGroup[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useEvent((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  });

  const handleDragEnd = useEvent((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeWalletId = active.id as string;
    const overWalletId = over.id as string;

    const newOrder = walletsOrder.map((group) => ({
      ...group,
      walletIds: [...group.walletIds],
    }));

    let activeGroupId: string | null = null;
    let activeIndex = -1;
    let overGroupId: string | null = null;
    let overIndex = -1;

    for (const group of newOrder) {
      const activeIdx = group.walletIds.indexOf(activeWalletId);
      if (activeIdx !== -1) {
        activeGroupId = group.id;
        activeIndex = activeIdx;
      }
      const overIdx = group.walletIds.indexOf(overWalletId);
      if (overIdx !== -1) {
        overGroupId = group.id;
        overIndex = overIdx;
      }
    }

    if (
      activeGroupId === null ||
      overGroupId === null ||
      activeIndex === -1 ||
      overIndex === -1
    ) {
      return;
    }

    const activeGroup = newOrder.find((g) => g.id === activeGroupId);
    const overGroup = newOrder.find((g) => g.id === overGroupId);

    if (!activeGroup || !overGroup) {
      return;
    }

    activeGroup.walletIds.splice(activeIndex, 1);

    if (activeGroupId === overGroupId) {
      activeGroup.walletIds.splice(overIndex, 0, activeWalletId);
    } else {
      overGroup.walletIds.splice(overIndex, 0, activeWalletId);
    }

    onChange(newOrder);
  });

  const allWalletIds = useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.map((item) =>
          getWalletId({
            address: item.wallet.address,
            groupId: item.group.id,
          })
        )
      ),
    [groups]
  );

  const activeWallet = useMemo(() => {
    if (!activeId) return null;
    for (const group of groups) {
      const item = group.items.find(
        (item) =>
          getWalletId({
            address: item.wallet.address,
            groupId: item.group.id,
          }) === activeId
      );
      if (item) {
        return { wallet: item.wallet, groupId: item.group.id };
      }
    }
    return null;
  }, [activeId, groups]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={allWalletIds}
        strategy={verticalListSortingStrategy}
      >
        <VStack gap={4}>
          {groups.map((group) => (
            <VStack key={group.id} gap={2}>
              <UIText
                kind="small/accent"
                color="var(--neutral-700)"
                style={{ paddingLeft: 4, paddingTop: 12 }}
              >
                {group.title}
              </UIText>
              <VStack gap={0}>
                {group.items.map(({ group: itemGroup, wallet }) => {
                  const key = getWalletId({
                    address: wallet.address,
                    groupId: itemGroup.id,
                  });
                  return (
                    <DraggableWalletItem
                      key={key}
                      walletId={key}
                      wallet={wallet}
                      groupId={itemGroup.id}
                    />
                  );
                })}
              </VStack>
            </VStack>
          ))}
        </VStack>
      </SortableContext>
      <DragOverlay>
        {activeWallet ? (
          <WalletListEditItem
            wallet={activeWallet.wallet}
            groupId={activeWallet.groupId}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function WalletListEdit({
  walletsOrder = DEFAULT_WALLET_LIST_GROUPS,
  walletGroups,
  onChange,
}: {
  walletsOrder?: WalletListGroup[];
  walletGroups: WalletGroupInfo[];
  onChange: (newOrder: WalletListGroup[]) => void;
}) {
  const groups = useMemo(
    () => getWalletItems({ walletsOrder, walletGroups }),
    [walletsOrder, walletGroups]
  );

  return (
    <WalletListEditInner
      groups={groups}
      walletsOrder={walletsOrder}
      onChange={onChange}
    />
  );
}
