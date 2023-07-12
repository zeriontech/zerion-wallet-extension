import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import { useMutation } from '@tanstack/react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { useNavigationState } from 'src/ui/shared/useNavigationState';
import type {
  WalletAbility,
  WalletAbilityType,
} from 'src/shared/types/Daylight';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { EmptyView } from 'src/ui/components/EmptyView';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { invariant } from 'src/shared/invariant';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { Surface } from 'src/ui/ui-kit/Surface';
import { walletPort } from 'src/ui/shared/channels';
import { markAbility, unmarkAbility, useFeedInfo } from './stored';
import type { StatusFilterParams } from './daylight';
import { useWalletAbilities } from './daylight';
import { FeedSkeleton } from './Loader';
import { ToggleButton } from './ToggleButton';
import * as styles from './styles.module.css';
import { Ability } from './Ability/Ability';
import { AbilityMenu } from './AbilityMenu';

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
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <div style={{ position: 'relative' }}>
      <ToggleButton
        onClick={() => {
          invariant(dialogRef.current, 'dialog element must be mounted');
          showConfirmDialog(dialogRef.current);
        }}
        isActive={value !== 'open'}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="caption/accent">
            {STATUS_TO_TITLE[value]} Abilities
          </UIText>
        </HStack>
      </ToggleButton>
      <BottomSheetDialog
        ref={dialogRef}
        style={{
          height: 'max-content',
          minHeight: '42vh',
          backgroundColor: 'var(--neutral-100)',
        }}
      >
        <DialogTitle alignTitle="start" title="Status" />
        <Spacer height={14} />
        <form method="dialog">
          <SurfaceList
            items={STATUS_ITEMS.map((item) => ({
              key: item,
              isInteractive: true,
              onClick: () => {
                onChange(item);
                walletPort.request('daylightAction', {
                  event_name: 'Perks: Select Status Filter',
                  perk_status: item,
                });
              },
              component: (
                <HStack
                  gap={4}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <UIText kind="body/regular">{STATUS_TO_TITLE[item]}</UIText>
                  {value === item ? (
                    <CheckIcon
                      style={{
                        color: 'var(--primary)',
                        width: 24,
                        height: 24,
                      }}
                    />
                  ) : null}
                </HStack>
              ),
            }))}
          />
        </form>
      </BottomSheetDialog>
    </div>
  );
}

type FeedAbilityType = 'claim' | 'airdrop' | 'mint' | 'vote';
type FeedAbilityTypeGroup = 'all' | 'other';

type FeedType = FeedAbilityType | FeedAbilityTypeGroup;

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

// we exlude article type from feed
const ABILITY_TYPE_GROUPS: Record<FeedAbilityTypeGroup, WalletAbilityType[]> = {
  all: [
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
  ],
  other: [
    'access',
    'event',
    'misc',
    'merch',
    'result',
    'raffle',
    'discount',
    'stake',
    'revoke',
  ],
};

function areFeedAbilityTypes(types: FeedType[]): types is FeedAbilityType[] {
  return !(types.includes('all') || types.includes('other'));
}

function getAbilityTypeParams(types: FeedType[]): WalletAbilityType[] {
  if (areFeedAbilityTypes(types)) {
    return types;
  }
  return types.includes('other')
    ? ABILITY_TYPE_GROUPS.other
    : ABILITY_TYPE_GROUPS.all;
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
  values,
  onChange,
}: {
  values: FeedType[];
  onChange(value: FeedType[] | null | undefined): void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const [selectedItems, setSelectedItems] = useState(new Set(values));
  const selectedItemsRef = useRef(selectedItems);

  const updateSelectedItems = useCallback((items: Set<FeedType>) => {
    selectedItemsRef.current = items;
    setSelectedItems(items);
  }, []);

  useEffect(() => {
    updateSelectedItems(new Set(values));
  }, [values, updateSelectedItems]);

  const toggleItem = useCallback(
    (item: FeedType) => {
      const set = new Set(selectedItems);
      if (set.has(item)) {
        set.delete(item);
      } else {
        set.add(item).delete('all');
      }
      updateSelectedItems(set);
    },
    [selectedItems, updateSelectedItems]
  );

  const handleShowDialog = () => {
    invariant(dialogRef.current, 'dialog element must be mounted');
    showConfirmDialog(dialogRef.current).then(() => {
      const set = selectedItemsRef.current;
      if (set.size == 0) {
        set.add('all');
      }
      const newValues = Array.from(set);
      onChange(newValues);
      walletPort.request('daylightAction', {
        event_name: 'Perks: Select Type Filter',
        perk_types: newValues,
      });
    });
  };

  const buttonText = useMemo(() => {
    if (values.includes('all')) {
      return 'All Types';
    }
    return values.length === 1
      ? `Type: ${TYPE_TO_TITLE[values[0]]}`
      : `Types: ${values.length}`;
  }, [values]);

  return (
    <div style={{ position: 'relative' }}>
      <ToggleButton
        onClick={handleShowDialog}
        isActive={!values.includes('all')}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="caption/accent">{buttonText}</UIText>
        </HStack>
      </ToggleButton>
      <BottomSheetDialog
        ref={dialogRef}
        style={{
          height: 'max-content',
          minHeight: '34vh',
          overflowY: 'auto',
          backgroundColor: 'var(--neutral-100)',
        }}
      >
        <DialogTitle alignTitle="start" title="Types" />
        <Spacer height={14} />
        <SurfaceList
          items={TYPE_ITEMS.map((item) => ({
            key: item,
            onClick: () => {
              if (dialogRef.current && item === 'all') {
                onChange(['all']);
                dialogRef.current.close();
              } else {
                toggleItem(item);
              }
            },
            component: (
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <UIText kind="body/regular">{TYPE_TO_TITLE[item]}</UIText>
                {selectedItems.has(item) ? (
                  <CheckIcon
                    style={{
                      color: 'var(--primary)',
                      width: 24,
                      height: 24,
                    }}
                  />
                ) : null}
              </HStack>
            ),
          }))}
        />
        <VStack gap={8}>
          <Spacer height={14} />
          <form method="dialog">
            <Button value="apply" kind="primary" style={{ width: '100%' }}>
              Apply
            </Button>
          </form>
        </VStack>
      </BottomSheetDialog>
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: 'var(--neutral-300)',
      }}
    />
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

  const showSeparator =
    isVisible ||
    (status === 'completed' && (filter === 'open' || filter === 'expired')) ||
    (status === 'dismissed' && (filter === 'open' || filter === 'expired'));

  return (
    <VStack
      key={ability.uid}
      gap={4}
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
      <VStack gap={16}>
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
          <Ability
            ability={ability}
            mode="compact"
            status={initialStatus}
            showStatus={false}
          />
        </UnstyledLink>
        <div style={{ position: 'absolute', top: 10, right: 16 }}>
          <AbilityMenu
            isInline={true}
            onMark={initialStatus ? undefined : handleMarkButtonClick}
            onUnmark={initialStatus ? handleUnmarkButtonClick : undefined}
          />
        </div>
        {showSeparator ? <Separator /> : null}
      </VStack>
    </VStack>
  );
}

interface FeedFilters {
  status: FeedStatus;
  types: FeedType[];
}

export function Feed() {
  const { singleAddress } = useAddressParams();
  const [filters, setFilters] = useNavigationState<FeedFilters>('filters', {
    status: 'open',
    types: ['all'],
  });

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
        type: getAbilityTypeParams(filters.types),
        ...(getAbilityStatusParams(filters.status) || {}),
      }),
      [filters]
    ),
    limit: ABILITIES_PER_PAGE,
    onSuccess: (data) => {
      if (
        !data.pages[0]?.abilities.length &&
        filters.status === 'open' &&
        filters.types.includes('all')
      ) {
        walletPort.request('daylightAction', {
          event_name: 'Perks: Empty List Shown',
          address: singleAddress,
        });
      }
      // we want to fetch next page immediately
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
    let filtered: WalletAbility[] = [];
    if (filters.status === 'completed') {
      filtered = feedData?.feed.completedAbilities || [];
    } else if (filters.status === 'dismissed') {
      filtered = feedData?.feed.dismissedAbilities || [];
    } else if (filters.status === 'expired') {
      filtered = value?.filter((item) => item.isClosed) || [];
    } else {
      filtered = value;
    }
    if (!filters.types.includes('all')) {
      const typesVisible = getAbilityTypeParams(filters.types);
      filtered = filtered.filter((item) => typesVisible.includes(item.type));
    }
    return filtered;
  }, [feedData, value, filters.status, filters.types]);

  const fetching =
    ((isFetchingNextPage || isFetching) &&
      (filters.status === 'open' || filters.status === 'expired')) ||
    (isLocalFetching &&
      (filters.status === 'completed' || filters.status === 'dismissed'));

  const setStatusFilter = (status: FeedStatus) =>
    setFilters({ ...filters, status });
  const setTypesFilter = (types: FeedType[]) =>
    setFilters({ ...filters, types });
  const resetFilters = () => setFilters({ status: 'open', types: ['all'] });

  return (
    <VStack gap={16}>
      <HStack
        gap={12}
        alignItems="center"
        style={{ paddingInline: 'var(--column-padding-inline)' }}
      >
        <StatusFilter value={filters.status} onChange={setStatusFilter} />
        <TypeFilter values={filters.types} onChange={setTypesFilter} />
        {filters.status !== 'open' || !filters.types.includes('all') ? (
          <UIText kind="small/accent" color="var(--primary)">
            <TextAnchor
              onClick={resetFilters}
              style={{
                display: 'inline',
                color: 'var(--primary)',
                cursor: 'pointer',
              }}
            >
              Reset
            </TextAnchor>
          </UIText>
        ) : null}
      </HStack>
      <Surface
        style={
          isPreviousData &&
          (filters.status === 'open' || filters.status === 'expired')
            ? { opacity: 0.6 }
            : undefined
        }
      >
        {!fetching && !abilities.length ? (
          <>
            <Spacer height={24} />
            <EmptyView text="No perks yet" />
          </>
        ) : null}
        {fetching ? (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        ) : null}
        {abilities.map((ability) => (
          <AbilityCard
            key={ability.uid}
            ability={ability}
            onMark={refetch}
            filter={filters.status}
            status={
              feedData?.completedSet.has(ability.uid)
                ? 'completed'
                : feedData?.dismissedSet.has(ability.uid)
                ? 'dismissed'
                : null
            }
          />
        ))}
      </Surface>
      {(filters.status === 'open' || filters.status === 'expired') &&
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
                  {fetching ? 'Fetching...' : 'More Abilities'}
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
