import React, { useRef } from 'react';
import {
  Popover,
  PopoverDisclosure,
  PopoverProvider,
  usePopoverStore,
} from 'src/ui/ui-kit/Popover';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import FlagIcon from 'jsx:src/ui/assets/flag.svg';
import ShareIcon from 'jsx:src/ui/assets/share.svg';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import type { PopoverToastHandle } from 'src/ui/pages/Settings/PopoverToast';
import { PopoverToast } from 'src/ui/pages/Settings/PopoverToast';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';

function MenuLabel({
  icon,
  children,
  color,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <HStack gap={12} alignItems="center" style={{ color }}>
      {icon}
      {children}
    </HStack>
  );
}

export function AssetMoreMenu({
  asset,
  isHidden,
  canHideMore,
  onHide,
  onUnhide,
}: {
  asset: Fungible;
  isHidden: boolean;
  canHideMore: boolean;
  onHide: () => void;
  onUnhide: () => void;
}) {
  const popoverStore = usePopoverStore({ placement: 'bottom-end' });
  const toastRef = useRef<PopoverToastHandle>(null);
  const { handleCopy } = useCopyToClipboard({
    text: `https://app.zerion.io/tokens/${asset.symbol}-${asset.id}`,
    onSuccess: () => toastRef.current?.showToast(),
  });

  const items: Item[] = [
    {
      key: 'share',
      onClick: () => {
        handleCopy();
        popoverStore.hide();
      },
      component: (
        <MenuLabel icon={<ShareIcon style={{ width: 20, height: 20 }} />}>
          <UIText kind="body/regular">Share</UIText>
        </MenuLabel>
      ),
    },
    isHidden
      ? {
          key: 'unhide',
          onClick: () => {
            onUnhide();
            popoverStore.hide();
          },
          component: (
            <MenuLabel icon={<EyeIcon style={{ width: 20, height: 20 }} />}>
              <UIText kind="body/regular">Unhide</UIText>
            </MenuLabel>
          ),
        }
      : {
          key: 'hide',
          disabled: !canHideMore,
          onClick: () => {
            onHide();
            popoverStore.hide();
          },
          component: (
            <MenuLabel icon={<EyeIcon style={{ width: 20, height: 20 }} />}>
              <VStack gap={0}>
                <UIText kind="body/regular">Hide</UIText>
                {canHideMore ? null : (
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    Limit reached
                  </UIText>
                )}
              </VStack>
            </MenuLabel>
          ),
        },
    {
      key: 'report',
      href: `https://zerion-io.typeform.com/to/IVsRHfBy?typeform-medium=embed-snippet#symbol=${asset.symbol}&asset_id=${asset.id}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      onClick: () => popoverStore.hide(),
      component: (
        <MenuLabel
          icon={<FlagIcon style={{ width: 20, height: 20 }} />}
          color="var(--negative-500)"
        >
          <UIText kind="body/regular">Report Asset</UIText>
        </MenuLabel>
      ),
    },
  ];

  return (
    <>
      <PopoverProvider store={popoverStore}>
        <PopoverDisclosure
          aria-label="Asset actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            border: 'none',
            borderRadius: 8,
            background: 'none',
            color: 'var(--neutral-500)',
            cursor: 'pointer',
          }}
        >
          <DotsIcon style={{ width: 24, height: 24 }} />
        </PopoverDisclosure>
        <Popover
          portal={true}
          portalElement={getRootDomNode}
          fixed={true}
          unmountOnHide={true}
          fitViewport={true}
          gutter={8}
          style={{
            zIndex: 10,
            minWidth: 208,
            padding: 4,
            borderRadius: 12,
            background: 'var(--surface-background-color, var(--z-index-1))',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
          }}
        >
          <SurfaceList items={items} />
        </Popover>
      </PopoverProvider>
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Link Copied to Clipboard
      </PopoverToast>
    </>
  );
}
