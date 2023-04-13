import React, { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { Content } from 'react-area';
import { useSelect } from 'downshift';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Button } from 'src/ui/ui-kit/Button';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { WalletAbility } from 'src/shared/types/Daylight';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { getAbility, getAbilityLinkTitle } from '../daylight';
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
                        highlighted={highlightedIndex === 0}
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
                        highlighted={highlightedIndex === 1}
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
                        highlighted={highlightedIndex === 0}
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
  invariant(ability_uid, 'ability_uid path segment is required');

  const { data } = useQuery(
    `ability/${ability_uid}`,
    () => getAbility(ability_uid),
    { suspense: false }
  );

  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(data?.ability);
  }, [data]);

  const { data: feedData, refetch, isFetching } = useFeedInfo();

  const { mutate: mark, isLoading: markLoading } = useMutation(
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
      },
    }
  );

  const { mutate: unmark, isLoading: unmarkLoading } = useMutation(
    (abilityId: string) => unmarkAbility({ abilityId }),
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  const handleMarkButtonClick = useCallback(
    (action: 'dismiss' | 'complete') => {
      if (data?.ability) {
        mark({ ability: data.ability, action });
      }
    },
    [mark, data]
  );

  const handleUnmarkButtonClick = useCallback(() => {
    unmark(ability_uid);
  }, [unmark, ability_uid]);

  const status = useMemo(
    () =>
      feedData?.completedSet.has(ability_uid)
        ? 'completed'
        : feedData?.dismissedSet.has(ability_uid)
        ? 'dismissed'
        : null,
    [feedData, ability_uid]
  );

  const loading = markLoading || unmarkLoading;

  return (
    <>
      <Content name="navigation-bar-end">
        <AbilityMenu
          onMark={status ? undefined : handleMarkButtonClick}
          onUnmark={status ? handleUnmarkButtonClick : undefined}
        />
      </Content>
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle
          title={null}
          documentTitle={data?.ability.title || ''}
        />
        <div style={{ paddingBottom: 80 }}>
          {data?.ability ? (
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
      </PageColumn>
      {data?.ability ? (
        <PageStickyFooter>
          <Spacer height={8} />
          <Button
            size={40}
            as={UnstyledAnchor}
            href={data.ability.action.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'sticky', bottom: 48 }}
            onClick={() => {
              walletPort.request('daylightAction', {
                event_name: 'Perks: External Link Clicked',
                ability_id: data.ability.uid,
                perk_type: data.ability.type,
                source: 'page',
              });
            }}
          >
            <HStack gap={8} justifyContent="center">
              {linkTitle}
              <LinkIcon />
            </HStack>
          </Button>
          <PageBottom />
        </PageStickyFooter>
      ) : null}
    </>
  );
}
