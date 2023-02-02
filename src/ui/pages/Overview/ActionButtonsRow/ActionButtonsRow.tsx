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

function findActionTab(
  tabs: browser.Tabs.Tab[],
  pathname: string
): browser.Tabs.Tab | undefined {
  return tabs.find((tab) => {
    if (!tab.url) {
      return false;
    }
    const url = new URL(tab.url);
    return url.origin === ZERION_ORIGIN && url.pathname === pathname;
  });
}

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

  const { data: tabs } = useQuery('browser/tabs', () => browser.tabs.query({}));
  const { mutate: updateTab } = useMutation(
    async ({
      tab,
      params,
    }: {
      tab: browser.Tabs.Tab;
      params: URLSearchParams;
    }) => {
      if (tab.url) {
        const url = new URL(tab.url);
        url.search = params.toString();
        browser.tabs.update(tab.id, { active: true, url: url.toString() });
      }
    }
  );

  if (!addWalletParams || !wallet) {
    return null;
  }

  const createActionHandler =
    (pathname: string) => (event: React.MouseEvent<HTMLElement>) => {
      acceptOrigin({
        origin: ZERION_ORIGIN,
        address: wallet.address,
      });

      const actionTab = tabs ? findActionTab(tabs, pathname) : null;
      if (actionTab) {
        updateTab({ tab: actionTab, params: addWalletParams });
        event.preventDefault();
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
          onClick={createActionHandler('/swap')}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Send"
          icon={<SendIcon />}
          href={`https://app.zerion.io/send?${addWalletParams}`}
          onClick={createActionHandler('/send/token')}
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
          onClick={createActionHandler('/bridge')}
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
