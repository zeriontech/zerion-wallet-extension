import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { Content } from 'react-area';
import { useSelect } from 'downshift';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Button } from 'src/ui/ui-kit/Button';
import LinkIcon from 'jsx:src/ui/assets/link.svg';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { getAbility, getAbilityLinkTitle, WalletAbility } from '../daylight';
import { markAbility, unmarkAbility, useFeedInfo } from '../stored';
import { Ability } from './Ability';

function AbilityMenu({
  onMark,
  onUnmark,
}: {
  onMark?(action: 'dismiss' | 'complete'): void;
  onUnmark?(): void;
}) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
  } = useSelect({
    items: ['dismiss', 'complete'],
    selectedItem: null,
  });
  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="ghost"
        size={40}
        style={{ padding: 8 }}
        {...getToggleButtonProps()}
      >
        <DotsIcon />
      </Button>
      <div
        {...getMenuProps()}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'var(--white)',
          boxShadow: '0px 8px 16px rgba(22, 22, 26, 0.16)',
          borderRadius: 8,
          width: 180,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <SurfaceList
          items={
            onMark
              ? [
                  {
                    key: 'complete',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        style={{
                          backgroundColor:
                            highlightedIndex === 0
                              ? 'var(--neutral-200)'
                              : undefined,
                        }}
                        {...getItemProps({
                          item: 'complete',
                          index: 0,
                          onClick: () => onMark('complete'),
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <DoubleCheckIcon />
                          Mark as complete
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                  {
                    key: 'dissmiss',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        style={{
                          backgroundColor:
                            highlightedIndex === 1
                              ? 'var(--neutral-200)'
                              : undefined,
                        }}
                        {...getItemProps({
                          item: 'dissmiss',
                          index: 1,
                          onClick: () => onMark('dismiss'),
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <CloseIcon />
                          Dismiss
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                ]
              : [
                  {
                    key: 'open',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        style={{
                          backgroundColor:
                            highlightedIndex === 1
                              ? 'var(--neutral-200)'
                              : undefined,
                        }}
                        {...getItemProps({
                          item: 'dissmiss',
                          index: 1,
                          onClick: onUnmark,
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <SyncIcon />
                          Open
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                ]
          }
        />
      </div>
    </div>
  );
}

export function AbilityPage() {
  const { ability_uid } = useParams();
  const [loading, setLoading] = useState(false);

  const { data } = useQuery(
    `ability/${ability_uid}`,
    () => getAbility(ability_uid || ''),
    { enabled: Boolean(ability_uid), suspense: false }
  );

  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(data?.ability);
  }, [data]);

  const { completedSet, dismissedSet, refetch, isFetching } = useFeedInfo();

  const { mutate: mark } = useMutation(
    ({
      ability,
      action,
    }: {
      ability: WalletAbility;
      action: 'complete' | 'dismiss';
    }) => markAbility({ ability, action }),
    {
      onSuccess: () => {
        refetch();
        setLoading(false);
      },
    }
  );

  const { mutate: unmark } = useMutation(
    (abilityId: string) => unmarkAbility({ abilityId }),
    {
      onSuccess: () => {
        refetch();
        setLoading(false);
      },
    }
  );

  const handleMarkButtonClick = useCallback(
    (action: 'dismiss' | 'complete') => {
      if (data?.ability) {
        mark({ ability: data.ability, action });
        setLoading(true);
      }
    },
    [mark, data]
  );

  const handleUnmarkButtonClick = useCallback(() => {
    if (ability_uid) {
      unmark(ability_uid);
      setLoading(true);
    }
  }, [unmark, ability_uid]);

  const status = useMemo(
    () =>
      !ability_uid
        ? null
        : completedSet.has(ability_uid)
        ? 'completed'
        : dismissedSet.has(ability_uid)
        ? 'dismissed'
        : null,
    [completedSet, dismissedSet, ability_uid]
  );

  return (
    <Background backgroundKind="transparent">
      <Content name="navigation-bar-end">
        <AbilityMenu
          onMark={status ? undefined : handleMarkButtonClick}
          onUnmark={status ? handleUnmarkButtonClick : undefined}
        />
      </Content>
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle title={null} />
        <div style={{ paddingBottom: 80 }}>
          {ability_uid && data?.ability ? (
            <Ability
              ability={data.ability}
              mode="full"
              status={status}
              loading={loading || isFetching}
            />
          ) : (
            <ViewLoading />
          )}
        </div>
        {data?.ability ? (
          <Button
            size={40}
            as={UnstyledAnchor}
            href={data.ability.action.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'fixed', bottom: 48, left: 16, right: 16 }}
          >
            <HStack gap={8} justifyContent="center">
              {linkTitle}
              <LinkIcon />
            </HStack>
          </Button>
        ) : null}
      </PageColumn>
    </Background>
  );
}
