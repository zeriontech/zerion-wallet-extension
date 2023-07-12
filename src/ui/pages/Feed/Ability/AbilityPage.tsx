import React, { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Content } from 'react-area';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Button } from 'src/ui/ui-kit/Button';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import type { WalletAbility } from 'src/shared/types/Daylight';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { getAbility, getAbilityLinkTitle } from '../daylight';
import { markAbility, unmarkAbility, useFeedInfo } from '../stored';
import { AbilityMenu } from '../AbilityMenu';
import { Ability } from './Ability';

export function AbilityPage() {
  const { ability_uid } = useParams();
  invariant(ability_uid, 'ability_uid path segment is required');

  const { data } = useQuery({
    queryKey: [`ability/${ability_uid}`],
    queryFn: () => getAbility(ability_uid),
    suspense: false,
  });

  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(data?.ability);
  }, [data]);

  const { data: feedData, refetch, isFetching } = useFeedInfo();

  const { mutate: mark, isLoading: markLoading } = useMutation({
    mutationFn: ({
      ability,
      action,
    }: {
      ability: WalletAbility;
      action: 'complete' | 'dismiss';
    }) => markAbility({ ability, action }),
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: unmark, isLoading: unmarkLoading } = useMutation({
    mutationFn: (abilityId: string) => unmarkAbility({ abilityId }),
    onSuccess: () => {
      refetch();
    },
  });

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
          isInline={false}
          onMark={status ? undefined : handleMarkButtonClick}
          onUnmark={status ? handleUnmarkButtonClick : undefined}
        />
      </Content>
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle
          title={null}
          documentTitle={data?.ability.title || 'Ability Page'}
        />
        <div style={{ paddingBottom: 80 }}>
          {data?.ability ? (
            <Ability
              ability={data.ability}
              mode="full"
              status={status}
              showStatus={true}
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
