import React, { useCallback, useMemo, useState } from 'react';
import { useSelect } from 'downshift';
import cn from 'classnames';
import { useMutation } from 'react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import FiltersIcon from 'jsx:src/ui/assets/filters.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { EmptyView } from 'src/ui/components/EmptyView';
import { useNavigationState } from 'src/ui/shared/useNavigationState';
import type {
  WalletAbility,
  WalletAbilityType,
} from 'src/shared/types/Daylight';
import { walletPort } from 'src/ui/shared/channels';
import { getAbilityLinkTitle, useWalletAbilities } from './daylight';
import type { StatusFilterParams } from './daylight';
import { Ability } from './Ability/Ability';
import { markAbility, unmarkAbility, useFeedInfo } from './stored';
import * as styles from './styles.module.css';
import { FeedSkeleton } from './Loader';

type FeedStatus = 'open' | 'completed' | 'expired' | 'dismissed';

const ABILITIES_PER_PAGE = 10;

const STATUS_TO_TITLE: Record<FeedStatus, string> = {
  open: 'Open',
  completed: 'Completed',
  expired: 'Expired',
  dismissed: 'Dissmised',
};

const STATUS_ITEMS: FeedStatus[] = [
  'open',
  'completed',
  'expired',
  'dismissed',
];

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
    items: STATUS_ITEMS,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(selectedItem);
      if (selectedItem) {
        walletPort.request('daylightAction', {
          event_name: 'Perks: Select Status Filter',
          perk_status: selectedItem,
        });
      }
    },
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
            {STATUS_TO_TITLE[value]} Abilities
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
          zIndex: 'var(--over-layout-index)',
        }}
      >
        <SurfaceList
          items={STATUS_ITEMS.map((item, index) => ({
            key: item,
            isInteractive: true,
            pad: false,
            separatorTop: false,
            component: (
              <SurfaceItemButton
                highlighted={highlightedIndex === index}
                {...getItemProps({ item, index })}
              >
                <HStack gap={4} justifyContent="space-between">
                  <span>{STATUS_TO_TITLE[item]}</span>
                  {selectedItem === item ? (
                    <CheckIcon
                      width={16}
                      height={16}
                      style={{ color: 'var(--primary)' }}
                    />
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

const TYPE_TO_TITLE: Record<FeedType, string> = {
  all: 'All',
  claim: 'Claim',
  airdrop: 'Airdrop',
  vote: 'Vote',
  mint: 'Mint',
  other: 'Other',
};

const TYPE_ITEMS: FeedType[] = [
  'all',
  'claim',
  'airdrop',
  'mint',
  'vote',
  'other',
];

function getAbilityTypeParams(type: FeedType): WalletAbilityType[] {
  if (type === 'all') {
    // we exlude article type from feed
    return [
      'vote',
      'claim',
      'airdrop',
      'mint',
      'access',
      'result',
      'event',
      'merch',
      'misc',
      'raffle',
      'discount',
      'stake',
      'revoke',
    ];
  }
  if (type === 'other') {
    return [
      'access',
      'event',
      'misc',
      'merch',
      'result',
      'raffle',
      'discount',
      'stake',
      'revoke',
    ];
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
    items: TYPE_ITEMS,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(selectedItem);
      if (selectedItem) {
        walletPort.request('daylightAction', {
          event_name: 'Perks: Select Type Filter',
          perk_type: selectedItem,
        });
      }
    },
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
            {value === 'all' ? 'All Types' : `Type: ${TYPE_TO_TITLE[value]}`}
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
          zIndex: 'var(--over-layout-index)',
        }}
      >
        <SurfaceList
          items={TYPE_ITEMS.map((item, index) => ({
            key: item,
            isInteractive: true,
            pad: false,
            separatorTop: false,
            component: (
              <SurfaceItemButton
                highlighted={highlightedIndex === index}
                {...getItemProps({ item, index })}
              >
                <HStack gap={4} justifyContent="space-between">
                  <span>{TYPE_TO_TITLE[item]}</span>
                  {selectedItem === item ? (
                    <CheckIcon
                      width={16}
                      height={16}
                      style={{ color: 'var(--primary)' }}
                    />
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

function AbilityCard({
  ability,
  onMark,
  filter,
  status: initialStatus,
}: {
  ability: WalletAbility;
  onMark(): void;
  filter: FeedStatus;
  status: null | 'completed' | 'dismissed';
}) {
  const [marking, setMarking] = useState<boolean>(false);
  const [status, setStatus] = useState<
    'completed' | 'dismissed' | 'restored' | null
  >(null);

  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(ability);
  }, [ability]);

  const { mutate: mark } = useMutation(
    (action: 'complete' | 'dismiss') => markAbility({ ability, action }),
    {
      onSuccess: (_, action) => {
        setMarking(false);
        setStatus(action === 'complete' ? 'completed' : 'dismissed');
        setTimeout(onMark, 500);
      },
    }
  );

  const { mutate: unmark } = useMutation(
    () => unmarkAbility({ abilityId: ability.uid }),
    {
      onSuccess: () => {
        setMarking(false);
        setStatus('restored');
        setTimeout(onMark, 500);
      },
    }
  );

  const handleMarkButtonClick = useCallback(
    (action: 'dismiss' | 'complete') => {
      mark(action);
      setMarking(true);
    },
    [mark]
  );

  const handleUnmarkButtonClick = useCallback(() => {
    unmark();
    setMarking(true);
  }, [unmark]);

  const isVisible = !(
    (filter === 'open' || filter === 'expired') &&
    Boolean(initialStatus)
  );

  const showRestoreButton =
    initialStatus && (filter === 'completed' || filter === 'dismissed');

  return (
    <VStack
      gap={16}
      className={cn(isVisible ? styles.visible : styles.hidden, {
        [styles.marking]: marking,
        [styles.completed]:
          status === 'completed' && (filter === 'open' || filter === 'expired'),
        [styles.dismissed]:
          status === 'dismissed' && (filter === 'open' || filter === 'expired'),
        [styles.restored]:
          status === 'restored' &&
          (filter === 'completed' || filter === 'dismissed'),
      })}
    >
      <UnstyledLink
        to={`/ability/${ability.uid}`}
        onClick={() => {
          walletPort.request('daylightAction', {
            event_name: 'Perks: Card Opened',
            ability_id: ability.uid,
            perk_type: ability.type,
          });
        }}
      >
        <Ability ability={ability} mode="compact" status={initialStatus} />
      </UnstyledLink>
      <HStack
        gap={8}
        style={{
          gridTemplateColumns: showRestoreButton ? '1fr 40px' : '1fr 40px 40px',
        }}
      >
        <Button
          style={{
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          size={40}
          as={UnstyledAnchor}
          href={ability.action.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            walletPort.request('daylightAction', {
              event_name: 'Perks: Link Clicked',
              ability_id: ability.uid,
              perk_type: ability.type,
              source: 'feed',
            });
          }}
        >
          <HStack gap={8} justifyContent="center">
            {linkTitle}
            <LinkIcon />
          </HStack>
        </Button>
        {showRestoreButton ? null : (
          <Button
            style={{ padding: 8 }}
            kind="regular"
            size={40}
            disabled={marking}
            onClick={() => handleMarkButtonClick('complete')}
          >
            <DoubleCheckIcon />
          </Button>
        )}
        {showRestoreButton ? null : (
          <Button
            style={{ padding: 7 }}
            kind="regular"
            size={40}
            disabled={marking}
            onClick={() => handleMarkButtonClick('dismiss')}
          >
            <CloseIcon />
          </Button>
        )}
        {showRestoreButton ? (
          <Button
            style={{ padding: 7 }}
            kind="regular"
            size={40}
            disabled={marking}
            onClick={() => handleUnmarkButtonClick()}
          >
            <SyncIcon />
          </Button>
        ) : null}
      </HStack>
    </VStack>
  );
}

export function Feed() {
  const { singleAddress } = useAddressParams();
  const [statusFilter, setStatusFilter] = useNavigationState<FeedStatus>(
    'status',
    'open'
  );
  const [typeFilter, setTypeFilter] = useNavigationState<FeedType>(
    'type',
    'all'
  );

  const {
    data: feedData,
    refetch,
    isFetching: isLocalFetching,
  } = useFeedInfo();

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
    limit: ABILITIES_PER_PAGE,
    onSuccess: (data) => {
      if (
        !data.pages[0]?.abilities.length &&
        statusFilter === 'open' &&
        typeFilter === 'all'
      ) {
        walletPort.request('daylightAction', {
          event_name: 'Perks: Empty List Shown',
          address: singleAddress,
        });
      }
      // we want to fetch next page imidiatelly
      // if we've already marked as completed more then half of fetched page
      const lastPage = data.pages[data.pages.length - 1];
      if (!lastPage.links.next) {
        return;
      }
      const filteredAbilities = lastPage.abilities.filter(
        (item) =>
          !feedData?.dismissedSet.has(item.uid) &&
          !feedData?.completedSet.has(item.uid)
      );
      if (filteredAbilities.length < ABILITIES_PER_PAGE / 2) {
        fetchNextPage({
          cancelRefetch: false,
          pageParam: { link: lastPage.links.next, address: singleAddress },
        });
      }
    },
  });

  const abilities = useMemo(() => {
    if (statusFilter === 'completed') {
      return feedData?.feed.completedAbilities || [];
    }
    if (statusFilter === 'dismissed') {
      return feedData?.feed.dismissedAbilities || [];
    }
    if (statusFilter === 'expired') {
      return value?.filter((item) => item.isClosed) || [];
    }
    return value;
  }, [feedData, value, statusFilter]);

  const fetching =
    ((isFetchingNextPage || isFetching) &&
      (statusFilter === 'open' || statusFilter === 'expired')) ||
    (isLocalFetching &&
      (statusFilter === 'completed' || statusFilter === 'dismissed'));

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
      {!fetching && !abilities?.length ? (
        <>
          <Spacer height={24} />
          <EmptyView text="No perks yet" />
        </>
      ) : null}
      <SurfaceList
        style={
          isPreviousData &&
          (statusFilter === 'open' || statusFilter === 'expired')
            ? { opacity: 0.6 }
            : undefined
        }
        items={[
          ...(abilities?.map((ability) => ({
            key: ability.uid,
            pad: false,
            style: { padding: 0 },
            component: (
              <AbilityCard
                ability={ability}
                onMark={refetch}
                filter={statusFilter}
                status={
                  feedData?.completedSet.has(ability.uid)
                    ? 'completed'
                    : feedData?.dismissedSet.has(ability.uid)
                    ? 'dismissed'
                    : null
                }
              />
            ),
          })) || []),
          ...(fetching
            ? [
                {
                  key: 'loader-1',
                  pad: false,
                  style: { padding: 0 },
                  component: <FeedSkeleton />,
                },
                {
                  key: 'loader-2',
                  pad: false,
                  style: { padding: 0 },
                  component: <FeedSkeleton />,
                },
              ]
            : []),
        ]}
      />
      {(statusFilter === 'open' || statusFilter === 'expired') &&
      hasNextPage ? (
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
                  More Abilities
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
