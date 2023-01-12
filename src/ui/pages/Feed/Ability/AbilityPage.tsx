import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
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
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { getAbility, getAbilityLinkTitle } from '../daylight';
import { Ability } from './Ability';

function AbilityDismissMenu() {
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
        }}
      >
        <SurfaceList
          items={[
            {
              key: 'complete',
              isInteractive: true,
              pad: false,
              separatorTop: false,
              component: (
                <SurfaceItemButton
                  style={{
                    backgroundColor:
                      highlightedIndex === 0 ? 'var(--neutral-200)' : undefined,
                  }}
                  {...getItemProps({ item: 'complete', index: 0 })}
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
                      highlightedIndex === 1 ? 'var(--neutral-200)' : undefined,
                  }}
                  {...getItemProps({ item: 'dissmiss', index: 1 })}
                >
                  <HStack gap={4} alignItems="center">
                    <CloseIcon />
                    Dismiss
                  </HStack>
                </SurfaceItemButton>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

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
      <Content name="navigation-bar-end">
        <AbilityDismissMenu />
      </Content>
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle title={null} />
        <div style={{ paddingBottom: 80 }}>
          {data?.ability ? (
            <Ability ability={data.ability} mode="full" />
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
