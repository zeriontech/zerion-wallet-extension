import React, { useMemo } from 'react';
import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import SidepanelIcon from 'jsx:src/ui/assets/sidepanel.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { FrameListItemButton } from 'src/ui/ui-kit/FrameList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { urlContext } from 'src/shared/UrlContext';
import { UIText } from 'src/ui/ui-kit/UIText';
import { openSidePanel } from '../sidepanel-apis';

function closeIfNotInTab() {
  if (urlContext.windowType !== 'tab') {
    window.close();
  }
}

function SidepanelOptionsButtonComponent() {
  const id = useId();
  const { data, refetch } = useQuery({
    queryKey: ['sidePanel/getPanelBehavior'],
    queryFn: () => {
      return chrome.sidePanel.getPanelBehavior();
    },
    staleTime: Infinity,
  });

  return (
    <div style={{ position: 'relative' }}>
      <Button
        // @ts-ignore TODO: Update to react@v18.3
        popovertarget={id}
        popovertargetaction="toggle"
        title="Sidepanel Options"
        kind="ghost"
        size={36}
        style={{ paddingInline: 8, ['anchorName' as string]: '--popover-1' }}
        onKeyDown={(event) => {
          const popoverEl = event.currentTarget
            .nextElementSibling as HTMLDivElement;
          if (event.key === 'Escape' && popoverEl.matches(':popover-open')) {
            // Prevent closing extension popup, close only popover
            event.preventDefault();
            popoverEl.hidePopover();
          }
        }}
      >
        <SidepanelIcon
          style={{
            display: 'block',
            width: 20,
            height: 20,
            color: data?.openPanelOnActionClick ? 'var(--primary)' : undefined,
          }}
        />
      </Button>
      <div
        id={id}
        // @ts-ignore TODO: Update to react@v18.3
        popover="auto"
        style={{
          position: 'absolute',
          ['positionAnchor' as string]: '--popover-1',
          margin: 0,
          top: 'anchor(bottom)',
          left: 'anchor(start)',
          // "right" property doesn't work, no idea why!!!
          marginLeft: -220,
          border: 'none',
          backgroundColor: 'transparent',
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            // Prevent closing extension popup, close only popover
            event.preventDefault();
            event.currentTarget.hidePopover();
          }
        }}
      >
        <Frame style={{ background: 'var(--z-index-1)', width: 250 }}>
          <VStack gap={0}>
            {data?.openPanelOnActionClick ? (
              <FrameListItemButton
                style={{ textAlign: 'start' }}
                onClick={async () => {
                  openSidePanel({
                    pathname: '/',
                    searchParams: null,
                  });

                  await chrome.sidePanel.setPanelBehavior({
                    openPanelOnActionClick: false,
                  });
                  window.close();
                }}
              >
                Close and Prefer Popup
              </FrameListItemButton>
            ) : (
              <FrameListItemButton
                style={{ textAlign: 'start' }}
                onClick={async () => {
                  await chrome.sidePanel.setPanelBehavior({
                    openPanelOnActionClick: false,
                  });
                  refetch();
                  if (
                    urlContext.windowType === 'sidepanel' &&
                    !data?.openPanelOnActionClick
                  ) {
                    // do nothing
                    return;
                  }
                  openSidePanel({
                    pathname: '/',
                    searchParams: null,
                  });
                  closeIfNotInTab();
                }}
              >
                <HStack
                  gap={12}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <span>
                    {urlContext.windowType === 'sidepanel'
                      ? 'Prefer Popup'
                      : 'Open Sidepanel Once'}
                  </span>
                  {urlContext.windowType === 'sidepanel' &&
                  !data?.openPanelOnActionClick ? (
                    <CheckIcon
                      style={{ width: 20, height: 20, color: 'var(--primary)' }}
                    />
                  ) : null}
                </HStack>
              </FrameListItemButton>
            )}
            <FrameListItemButton
              style={{ textAlign: 'start' }}
              onClick={async () => {
                await chrome.sidePanel.setPanelBehavior({
                  openPanelOnActionClick: true,
                });
                refetch();
                if (urlContext.windowType !== 'sidepanel') {
                  await openSidePanel({
                    pathname: '/',
                    searchParams: null,
                  });
                  closeIfNotInTab();
                }
              }}
            >
              <HStack
                gap={12}
                alignItems="center"
                justifyContent="space-between"
              >
                <span>Prefer Sidepanel</span>
                {data?.openPanelOnActionClick ? (
                  <CheckIcon
                    style={{ width: 20, height: 20, color: 'var(--primary)' }}
                  />
                ) : null}
              </HStack>
            </FrameListItemButton>
          </VStack>
          <UIText
            kind="small/regular"
            color="var(--neutral-500)"
            style={{ paddingLeft: 12 }}
          >
            Use{' '}
            <kbd
              style={{
                backgroundColor: 'var(--neutral-200)',
                padding: '1px 3px',
                borderRadius: 4,
                border: '1px solid var(--neutral-300)',
              }}
            >
              Ctrl+Shift+E
            </kbd>{' '}
            to open extension in a preferred way (popup or sidepanel)
          </UIText>
        </Frame>
      </div>
    </div>
  );
}

export function SidepanelOptionsButton() {
  const requiredApisSupported = useMemo(() => {
    const supportsCssAnchor = CSS.supports('anchor-name: --name');
    // NOTE: this is a recommended way to check popover support from MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/popoverTargetElement#toggle_popover_action_with_an_auto_popover
    // eslint-disable-next-line no-prototype-builtins
    const supportsPopover = HTMLElement.prototype.hasOwnProperty('popover');
    const supportsSidepanel = window.chrome && 'sidePanel' in chrome;
    return supportsCssAnchor && supportsPopover && supportsSidepanel;
  }, []);
  if (!requiredApisSupported) {
    return null;
  }
  return <SidepanelOptionsButtonComponent />;
}
