import browser from 'webextension-polyfill';
import cx from 'classnames';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actions/receive.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import BuyIcon from 'jsx:src/ui/assets/actions/buy.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { walletPort } from 'src/ui/shared/channels';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { ThemeStore, themeStore } from 'src/ui/features/appearance';
import { useStore } from '@store-unit/react';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import * as s from './styles.module.css';

function ActionButton<As extends ElementType = 'a'>({
  as,
  icon,
  title,
  ...props
}: {
  icon: React.ReactNode;
  title: React.AnchorHTMLAttributes<HTMLAnchorElement>['title'];
} & { as?: As } & ComponentPropsWithoutRef<As>) {
  const Element = as || UnstyledAnchor;
  const themeState = useStore(themeStore);
  return (
    <Element
      {...props}
      className={cx(
        s.actionButton,
        ThemeStore.isDark(themeState) ? s.dark : undefined
      )}
    >
      <VStack gap={4} style={{ placeItems: 'center' }}>
        <div className={s.icon} title={title}>
          {icon}
        </div>
        {title}
      </VStack>
    </Element>
  );
}

const ZERION_ORIGIN = 'https://app.zerion.io';

export function ActionButtonsRow() {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  const { mutate: acceptOrigin } = useMutation({
    mutationFn: async ({
      address,
      origin,
    }: {
      address: string;
      origin: string;
    }) => {
      return walletPort.request('acceptOrigin', { origin, address });
    },
  });
  const addWalletParams = useWalletParams(wallet);

  const { data: activeTabs } = useQuery({
    queryKey: ['browser/activeTab'],
    queryFn: () => browser.tabs.query({ active: true, currentWindow: true }),
  });
  const activeTab = activeTabs ? activeTabs[0] : null;
  const { mutate: updateTab } = useMutation({
    mutationFn: async ({ tab, url }: { tab: browser.Tabs.Tab; url: string }) =>
      browser.tabs.update(tab.id, { url }),
  });
  if (!addWalletParams || !wallet) {
    return null;
  }
  const performAction = (event: React.MouseEvent<HTMLElement>) => {
    acceptOrigin({ origin: ZERION_ORIGIN, address: wallet.address });
    const href = event.currentTarget.getAttribute('href');
    const activeTabUrl = activeTab?.url ? new URL(activeTab.url) : null;
    if (href && activeTab && activeTabUrl?.origin == ZERION_ORIGIN) {
      event.preventDefault();
      updateTab({ tab: activeTab, url: href });
    }
  };

  const iconStyle = { width: 28, height: 28 };
  return (
    <ul
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'space-between',
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}
    >
      <li>
        <ActionButton
          title="Swap"
          icon={<SwapIcon style={iconStyle} />}
          href={`https://app.zerion.io/swap?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Send"
          icon={<SendIcon style={iconStyle} />}
          href={`https://app.zerion.io/send?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Receive"
          as={UnstyledLink}
          icon={<ReceiveIcon style={iconStyle} />}
          to={`/receive?address=${wallet.address}`}
        />
      </li>
      <li>
        <ActionButton
          title="Bridge"
          icon={<BridgeIcon style={iconStyle} />}
          href={`https://app.zerion.io/bridge?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Buy"
          icon={<BuyIcon style={iconStyle} />}
          href={`https://app.zerion.io/deposit?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
    </ul>
  );
}
