import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { Button } from 'src/ui/ui-kit/Button';
import LinkIcon from 'jsx:src/ui/assets/link.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { getAbility, getAbilityLinkTitle } from '../daylight';
import { Ability } from './Ability';

export function AbilityPage() {
  const { ability_uid } = useParams();

  const { data } = useQuery(
    `ability/${ability_uid}`,
    () => getAbility(ability_uid || ''),
    { enabled: Boolean(ability_uid), suspense: false }
  );

  const linkTitle = useMemo(() => {
    return getAbilityLinkTitle(data?.ability);
  }, [data]);

  return (
    <Background backgroundKind="transparent">
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle title={null} />
        {data?.ability ? (
          <Ability ability={data.ability} mode="full" />
        ) : (
          <ViewLoading />
        )}
        {data?.ability ? (
          <Button
            size={40}
            as={UnstyledAnchor}
            href={data.ability.action.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'fixed', bottom: 24, left: 16, right: 16 }}
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
