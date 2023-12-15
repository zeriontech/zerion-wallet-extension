import React, { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
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
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { BackButton } from 'src/ui/components/BackButton';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { getAbility, getAbilityLinkTitle } from '../daylight';
import { markAbility, unmarkAbility, useFeedInfo } from '../stored';
import { Ability } from './Ability';
import { AbilityMenu } from './AbilityMenu';

const IMAGE_SHIFT = -70;

export function AbilityPage() {
  const navigate = useNavigate();
  const { singleAddressNormalized, ready } = useAddressParams();
  useBodyStyle(
    useMemo(
      () => ({
        ['--background' as string]: 'var(--white)',
        ['--url-bar-background' as string]: 'transparent',
      }),
      []
    )
  );

  const { ability_uid } = useParams();
  invariant(ability_uid, 'ability_uid path segment is required');

  const { data } = useQuery({
    queryKey: ['getAbility', singleAddressNormalized, ability_uid],
    queryFn: () => getAbility(singleAddressNormalized, ability_uid),
    suspense: false,
    enabled: ready,
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

  const linkUrl = data?.ability.action.linkUrl;
  const abilityActionUrl = useMemo(
    () => (linkUrl ? prepareForHref(linkUrl)?.toString() : undefined),
    [linkUrl]
  );

  const { singleAddress } = useAddressParams();

  return (
    <>
      <Content name="navigation-bar-back-button">
        <BackButton
          kind="neutral"
          style={{
            paddingInline: 8,
            ['--button-background' as string]: 'var(--white)',
          }}
          onClick={() => navigate(getBackOrHome() as number)}
          title={`Press "backspace" to navigate back`}
        />
      </Content>
      <Content name="navigation-bar-end">
        <AbilityMenu
          onMark={status ? undefined : handleMarkButtonClick}
          onUnmark={status ? handleUnmarkButtonClick : undefined}
          style={{
            ['--surface-background-color' as string]: 'var(--z-index-0)',
          }}
        />
      </Content>
      <PageColumn
        style={{
          paddingTop: 18,
          position: 'relative',
          backgroundColor: 'var(--white)',
          top: IMAGE_SHIFT,
        }}
      >
        <NavigationTitle
          title={null}
          documentTitle={data?.ability.title || 'Ability Page'}
        />
        {data?.ability.imageUrl ? (
          <img
            alt={data.ability.title}
            src={data.ability.imageUrl}
            style={{
              position: 'relative',
              left: -16,
              width: 'calc(100% + 32px)',
              objectFit: 'cover',
              objectPosition: '50% 50%',
            }}
          />
        ) : (
          <Spacer height={56} />
        )}

        <div style={{ paddingBottom: 8 }}>
          <Spacer height={16} />
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
      {data?.ability && abilityActionUrl ? (
        <PageStickyFooter>
          <Spacer height={8} />
          <Button
            size={44}
            as={UnstyledAnchor}
            href={abilityActionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'sticky', bottom: 48 }}
            onClick={() => {
              walletPort.request('daylightAction', {
                address: singleAddress,
                event_name: 'Perks: Link Clicked',
                ability_id: data.ability.uid,
                perk_type: data.ability.type,
                perk_url: abilityActionUrl,
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
