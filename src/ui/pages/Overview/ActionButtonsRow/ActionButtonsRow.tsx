import browser from 'webextension-polyfill';
import React, { ComponentPropsWithoutRef, ElementType, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actions/receive.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import BuyIcon from 'jsx:src/ui/assets/actions/buy.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { walletPort } from 'src/ui/shared/channels';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
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
  return (
    <Element {...props} className={s.actionButton}>
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
  const { data: wallet } = useQuery('wallet/uiGetCurrentWallet', () => {
    return walletPort.request('uiGetCurrentWallet');
  });
  const { mutate: acceptOrigin } = useMutation(
    async ({ address, origin }: { address: string; origin: string }) => {
      return walletPort.request('acceptOrigin', { origin, address });
    }
  );
  const addWalletParams = useMemo(() => {
    if (!wallet) {
      return null;
    }
    const params = new URLSearchParams({
      addWallet: wallet.address,
      addWalletProvider: 'zerion-extension',
    });
    if (wallet.name) {
      params.append('addWalletName', wallet.name);
    }
    return params;
  }, [wallet]);
  const { data: activeTabs } = useQuery('browser/activeTab', () =>
    browser.tabs.query({ active: true, currentWindow: true })
  );
  const activeTab = activeTabs ? activeTabs[0] : null;
  const { mutate: updateTab } = useMutation(
    async ({ tab, url }: { tab: browser.Tabs.Tab; url: string }) =>
      browser.tabs.update(tab.id, { url })
  );
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
          icon={<SwapIcon />}
          href={`https://app.zerion.io/swap?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Send"
          icon={<SendIcon />}
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
          icon={<ReceiveIcon />}
          to={`/receive?address=${wallet.address}`}
        />
      </li>
      <li>
        <ActionButton
          title="Bridge"
          icon={<BridgeIcon />}
          href={`https://app.zerion.io/bridge?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          as={UnstyledLink}
          to="/not-implemented"
          title="Buy"
          icon={<BuyIcon />}
        />
      </li>
    </ul>
  );
}
