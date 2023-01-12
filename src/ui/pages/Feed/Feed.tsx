import React, { useMemo, useState } from 'react';
import { useSelect } from 'downshift';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import FiltersIcon from 'jsx:src/ui/assets/filters.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import LinkIcon from 'jsx:src/ui/assets/link.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { getAbilityLinkTitle, useWalletAbilities } from './daylight';
import type {
  WalletAbility,
  WalletAbilityType,
  StatusFilterParams,
} from './daylight';
import { Ability } from './Ability/Ability';

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

type FeedType = 'all' | 'claim' | 'airdrop' | 'mint' | 'vote' | 'other';

const TypeToTitle: Record<FeedType, string> = {
  all: 'All',
  claim: 'Claim',
  airdrop: 'Airdrop',
  vote: 'Vote',
  mint: 'Mint',
  other: 'Other',
};

const TypeItems: FeedType[] = [
  'all',
  'claim',
  'airdrop',
  'mint',
  'vote',
  'other',
];

function getAbilityTypeParams(type: FeedType): WalletAbilityType[] {
  if (type === 'all') {
    return [];
  }
  if (type === 'other') {
    return ['access', 'article', 'event', 'misc', 'product', 'result'];
  }
  return [type];
}

function getAbilityStatusParams(
  status: FeedStatus
): StatusFilterParams | undefined {
  if (status === 'open' || status === 'dismissed') {
    return undefined;
  }
  if (status === 'completed') {
    return {
      deadline: 'all',
      showCompleted: true,
    };
  }
  if (status === 'expired') {
    return {
      deadline: 'expired',
      showCompleted: true,
    };
  }
}

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
  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(ability);
  }, [ability]);

  return (
    <VStack gap={16}>
      <div />
      <UnstyledLink to={`/ability/${ability.uid}`}>
        <Ability ability={ability} mode="compact" />
      </UnstyledLink>
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 40px 40px' }}>
        <Button
          style={{ width: '100%' }}
          size={40}
          as={UnstyledAnchor}
          href={ability.action.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <HStack gap={8} justifyContent="center">
            {linkTitle}
            <LinkIcon />
          </HStack>
        </Button>
        <Button style={{ padding: 8 }} kind="regular" size={40}>
          <DoubleCheckIcon />
        </Button>
        <Button style={{ padding: 7 }} kind="regular" size={40}>
          <CloseIcon />
        </Button>
      </HStack>
      <div />
    </VStack>
  );
}

export function Feed() {
  const { singleAddress } = useAddressParams();
  const [statusFilter, setStatusFilter] = useState<FeedStatus>('open');
  const [typeFilter, setTypeFilter] = useState<FeedType>('all');
  const {
    value,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPreviousData,
  } = useWalletAbilities({
    address: singleAddress,
    params: useMemo(
      () => ({
        type: getAbilityTypeParams(typeFilter),
        ...(getAbilityStatusParams(statusFilter) || {}),
      }),
      [typeFilter, statusFilter]
    ),
  });

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
      {isFetching && !value.length ? (
        <ViewLoading />
      ) : (
        <SurfaceList
          style={isPreviousData ? { opacity: 0.6 } : undefined}
          items={value.map((ability) => ({
            key: ability.uid,
            pad: false,
            component: <AbilityCard ability={ability} />,
          }))}
        />
      )}
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
