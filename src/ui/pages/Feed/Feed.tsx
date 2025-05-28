import React, { useCallback, useMemo, useState } from 'react';
import { useSelect } from 'downshift';
import cn from 'classnames';
import { useMutation } from '@tanstack/react-query';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import comingSoonImgSrc from 'url:src/ui/assets/coming-soon@2x.png';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { EmptyView } from 'src/ui/components/EmptyView';
import { useNavigationState } from 'src/ui/shared/useNavigationState';
import type {
  WalletAbility,
  WalletAbilityType,
} from 'src/shared/types/Daylight';
import { walletPort } from 'src/ui/shared/channels';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { useStore } from '@store-unit/react';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { getGrownTabMaxHeight, offsetValues } from '../Overview/getTabsOffset';
import { useWalletAbilities } from './daylight';
import type { StatusFilterParams } from './daylight';
import { Ability } from './Ability/Ability';
import { markAbility, unmarkAbility, useFeedInfo } from './stored';
import * as styles from './styles.module.css';
import { FeedSkeleton } from './Loader';
import { AbilityMenu } from './Ability/AbilityMenu';

type FeedStatus = 'open' | 'completed' | 'expired' | 'dismissed';

const ABILITIES_PER_PAGE = 10;

const STATUS_TO_TITLE: Record<FeedStatus, string> = {
  open: 'Open',
  completed: 'Completed',
  expired: 'Expired',
  dismissed: 'Dismissed',
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
    },
  });

  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="regular"
        size={32}
        style={{ paddingLeft: 12, paddingRight: 8 }}
        {...getToggleButtonProps()}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="caption/accent">
            {STATUS_TO_TITLE[value]} Abilities
          </UIText>
          <ArrowDownIcon />
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

type FeedType = 'all' | 'claim' | 'airdrop' | 'mint';

const TYPE_TO_TITLE: Record<FeedType, string> = {
  all: 'All',
  claim: 'Claim',
  airdrop: 'Airdrop',
  mint: 'Mint',
};

const TYPE_ITEMS: FeedType[] = ['all', 'claim', 'airdrop', 'mint'];

function getAbilityTypeParams(type: FeedType): WalletAbilityType[] {
  if (type === 'all') {
    return [
      'claim',
      'airdrop',
      'mint',
      // 'article',
      // 'access',
      // 'result',
      // 'event',
      // 'merch',
      // 'misc',
      // 'raffle',
      // 'discount',
      // 'stake',
      // 'revoke',
    ];
  }
  // if (type === 'other') {
  //   return [
  //     'access',
  //     'event',
  //     'misc',
  //     'merch',
  //     'result',
  //     'raffle',
  //     'discount',
  //     'stake',
  //     'revoke',
  //     'vote',
  //   ];
  // }
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
    },
  });

  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="regular"
        size={32}
        style={{ paddingLeft: 12, paddingRight: 8 }}
        {...getToggleButtonProps()}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="caption/accent">
            {value === 'all' ? 'All Types' : `Type: ${TYPE_TO_TITLE[value]}`}
          </UIText>
          <ArrowDownIcon />
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

function AbilityCard({
  ability,
  onMark,
  filter,
  address,
  status: initialStatus,
}: {
  ability: WalletAbility;
  onMark(): void;
  filter: FeedStatus;
  address: string;
  status: null | 'completed' | 'dismissed';
}) {
  const [marking, setMarking] = useState<boolean>(false);
  const [status, setStatus] = useState<
    'completed' | 'dismissed' | 'restored' | null
  >(null);

  const { mutate: mark } = useMutation({
    mutationFn: (action: 'complete' | 'dismiss') =>
      markAbility({ ability, action }),
    onSuccess: (_, action) => {
      setMarking(false);
      setStatus(action === 'complete' ? 'completed' : 'dismissed');
      setTimeout(onMark, 500);
    },
  });

  const { mutate: unmark } = useMutation({
    mutationFn: () => unmarkAbility({ abilityId: ability.uid }),
    onSuccess: () => {
      setMarking(false);
      setStatus('restored');
      setTimeout(onMark, 500);
    },
  });

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
      <div style={{ position: 'relative', paddingTop: 4 }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <AbilityMenu
            onMark={showRestoreButton ? undefined : handleMarkButtonClick}
            onUnmark={showRestoreButton ? handleUnmarkButtonClick : undefined}
            style={{
              ['--surface-background-color' as string]: 'var(--z-index-1)',
            }}
          />
        </div>
        <UnstyledLink
          to={`/ability/${ability.uid}`}
          onClick={() => {
            walletPort.request('daylightAction', {
              address,
              event_name: 'Perks: Card Opened',
              ability_id: ability.uid,
              perk_type: ability.type,
            });
          }}
        >
          <Ability ability={ability} mode="compact" status={initialStatus} />
        </UnstyledLink>
      </div>
      <div
        style={{
          height: 1,
          width: '100%',
          backgroundColor: 'var(--neutral-200)',
        }}
      />
    </VStack>
  );
}

function FeedComponent({ address }: { address: string }) {
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
    address,
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
          address,
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
          pageParam: { link: lastPage.links.next, address },
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

  const feedFilters = (
    <HStack gap={8} alignItems="center" style={{ paddingInline: 16 }}>
      <StatusFilter
        value={statusFilter}
        onChange={(value) => setStatusFilter(value || 'open')}
      />
      <TypeFilter
        value={typeFilter}
        onChange={(value) => setTypeFilter(value || 'all')}
      />
    </HStack>
  );

  const offsetValuesState = useStore(offsetValues);
  if (!abilities?.length) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        <div style={{ position: 'absolute', left: 0 }}>{feedFilters}</div>
        {fetching ? <ViewLoading /> : <EmptyView>No perks yet</EmptyView>}
      </CenteredFillViewportView>
    );
  }
  return (
    <>
      {feedFilters}
      <Spacer height={16} />
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
                address={address}
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
              style: { height: 40 },
              component: fetching ? (
                <DelayedRender delay={400}>
                  <ViewLoading />
                </DelayedRender>
              ) : (
                <UIText kind="body/accent" color="var(--primary)">
                  Show More
                </UIText>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}

export function Feed() {
  const { singleAddress } = useAddressParams();
  const offsetValuesState = useStore(offsetValues);

  if (isSolanaAddress(singleAddress)) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        <VStack
          gap={16}
          style={{ padding: 20, textAlign: 'center', placeItems: 'center' }}
        >
          <img style={{ width: 80 }} src={comingSoonImgSrc} alt="" />
          <UIText kind="body/accent">Perks coming soon</UIText>
        </VStack>
      </CenteredFillViewportView>
    );
  }

  return <FeedComponent address={singleAddress} />;
}
