import React, { useState } from 'react';
import { useSelect } from 'downshift';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import FiltersIcon from 'jsx:src/ui/assets/filters.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useWalletAbilities, WalletAbility } from './daylight';

type FeedStatus = 'open' | 'completed' | 'expired' | 'dismissed';

const StatusToTitle: Record<FeedStatus, string> = {
  open: 'Open',
  completed: 'Completed',
  expired: 'Expired',
  dismissed: 'Dissmised',
};

const StatusItems: FeedStatus[] = ['open', 'completed', 'expired', 'dismissed'];

function StatusFilter({
  value,
  onChange,
}: {
  value: FeedStatus;
  onChange(value: FeedStatus | null | undefined): void;
}) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    selectedItem,
    highlightedIndex,
  } = useSelect({
    items: StatusItems,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => onChange(selectedItem),
  });

  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="regular"
        size={28}
        style={{ padding: '0 16px' }}
        {...getToggleButtonProps()}
      >
        <HStack gap={4} alignItems="center">
          <FiltersIcon />
          <UIText kind="button/s_med">{StatusToTitle[value]} Abilities</UIText>
        </HStack>
      </Button>
      <div
        {...getMenuProps()}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% + 8px)',
          background: 'var(--white)',
          boxShadow: '0px 8px 16px rgba(22, 22, 26, 0.16)',
          borderRadius: 8,
          width: 180,
          overflow: 'hidden',
        }}
      >
        <SurfaceList
          items={StatusItems.map((item, index) => ({
            key: item,
            isInteractive: true,
            pad: false,
            separatorTop: false,
            component: (
              <SurfaceItemButton
                style={{
                  backgroundColor:
                    highlightedIndex === index
                      ? 'var(--neutral-200)'
                      : undefined,
                }}
                {...getItemProps({ item, index })}
              >
                <HStack gap={4} justifyContent="space-between">
                  <span>{StatusToTitle[item]}</span>
                  {selectedItem === item ? (
                    <span style={{ color: 'var(--primary)' }}>✔</span>
                  ) : null}
                </HStack>
              </SurfaceItemButton>
            ),
          }))}
        />
      </div>
    </div>
  );
}

type FeedType = 'all' | 'gate' | 'airdrop' | 'vote' | 'other';

const TypeToTitle: Record<FeedType, string> = {
  all: 'All',
  gate: 'Gate',
  airdrop: 'Airdrop',
  vote: 'Vote',
  other: 'Other',
};

const TypeItems: FeedType[] = ['all', 'gate', 'airdrop', 'vote', 'other'];

function TypeFilter({
  value,
  onChange,
}: {
  value: FeedType;
  onChange(value: FeedType | null | undefined): void;
}) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    selectedItem,
    highlightedIndex,
  } = useSelect({
    items: TypeItems,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => onChange(selectedItem),
  });

  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="regular"
        size={28}
        style={{ padding: '0 16px' }}
        {...getToggleButtonProps()}
      >
        <HStack gap={4} alignItems="center">
          <FiltersIcon />
          <UIText kind="button/s_med">
            {value === 'all' ? 'All Types' : `Type: ${TypeToTitle[value]}`}
          </UIText>
        </HStack>
      </Button>
      <div
        {...getMenuProps()}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% + 8px)',
          background: 'var(--white)',
          boxShadow: '0px 8px 16px rgba(22, 22, 26, 0.16)',
          borderRadius: 8,
          width: 180,
          overflow: 'hidden',
        }}
      >
        <SurfaceList
          items={TypeItems.map((item, index) => ({
            key: item,
            isInteractive: true,
            pad: false,
            separatorTop: false,
            component: (
              <SurfaceItemButton
                style={{
                  backgroundColor:
                    highlightedIndex === index
                      ? 'var(--neutral-200)'
                      : undefined,
                }}
                {...getItemProps({ item, index })}
              >
                <HStack gap={4} justifyContent="space-between">
                  <span>{TypeToTitle[item]}</span>
                  {selectedItem === item ? (
                    <span style={{ color: 'var(--primary)' }}>✔</span>
                  ) : null}
                </HStack>
              </SurfaceItemButton>
            ),
          }))}
        />
      </div>
    </div>
  );
}

function AbilityCard({ ability }: { ability: WalletAbility }) {
  return null;
}

export function Feed() {
  const { singleAddress } = useAddressParams();
  const [statusFilter, setStatusFilter] = useState<FeedStatus>('open');
  const [typeFilter, setTypeFilter] = useState<FeedType>('all');
  const { value, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWalletAbilities(singleAddress);

  const fetching = isFetchingNextPage || isFetching;

  return (
    <VStack gap={16}>
      <HStack gap={12} alignItems="center">
        <StatusFilter
          value={statusFilter}
          onChange={(value) => setStatusFilter(value || 'open')}
        />
        <TypeFilter
          value={typeFilter}
          onChange={(value) => setTypeFilter(value || 'all')}
        />
      </HStack>
      <SurfaceList
        items={value.map((ability) => ({
          key: ability.uid,
          pad: false,
          component: <AbilityCard ability={ability} />,
        }))}
      />
      {hasNextPage ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: fetching ? undefined : () => fetchNextPage(),
              component: (
                <span
                  style={{
                    color: fetching ? 'var(--neutral-500)' : 'var(--primary)',
                  }}
                >
                  More abilities
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
