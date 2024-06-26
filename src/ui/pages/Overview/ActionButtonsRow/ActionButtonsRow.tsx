import browser from 'webextension-polyfill';
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
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { WithMainnetOnlyWarningDialog } from 'src/ui/features/testnet-mode/MainnetOnlyWarningDialog';
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
      <div className={s.icon} title={title}>
        {icon}
      </div>
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

  return (
    <ul
      style={{
        display: 'grid',
        gap: 8,
        gridTemplateColumns: 'repeat(4, 48px) 1fr',
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}
    >
      <li>
        {process.env.FEATURE_SEND_FORM === 'on' ? (
          <ActionButton
            title="Send"
            as={UnstyledLink}
            icon={<SendIcon />}
            to="/send-form"
          />
        ) : (
          <ActionButton
            title="Send"
            icon={<SendIcon />}
            href={`${ZERION_ORIGIN}/send?${addWalletParams}`}
            onClick={performAction}
            target="_blank"
            rel="noopener noreferrer"
          />
        )}
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
          href={`${ZERION_ORIGIN}/bridge?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Buy"
          icon={<BuyIcon />}
          href={`${ZERION_ORIGIN}/deposit?${addWalletParams}`}
          onClick={performAction}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        {process.env.FEATURE_SEND_FORM === 'on' ? (
          <WithMainnetOnlyWarningDialog<'a'>
            message="Testnets are not supported in Swap"
            render={({ handleClick }) => (
              <Button
                aria-label="Swap"
                size={48}
                as={UnstyledLink}
                onClick={handleClick}
                to="/swap-form"
                style={{
                  borderRadius: 24,
                  width: '100%',
                  ['--button-background' as string]: 'var(--black)',
                  ['--button-text' as string]: 'var(--white)',
                  ['--button-background-hover' as string]: 'var(--neutral-800)',
                }}
              >
                <HStack gap={6} alignItems="center">
                  <div style={{ display: 'flex' }}>
                    <SwapIcon />
                  </div>
                  <UIText kind="small/accent">Swap</UIText>
                </HStack>
              </Button>
            )}
          />
        ) : (
          <Button
            aria-label="Swap"
            size={48}
            as={UnstyledAnchor}
            href={`${ZERION_ORIGIN}/swap?${addWalletParams}`}
            onClick={performAction}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              borderRadius: 24,
              width: '100%',
              ['--button-background' as string]: 'var(--black)',
              ['--button-text' as string]: 'var(--white)',
              ['--button-background-hover' as string]: 'var(--neutral-800)',
            }}
          >
            <HStack gap={6} alignItems="center">
              <div style={{ display: 'flex' }}>
                <SwapIcon />
              </div>
              <UIText kind="small/accent">Swap</UIText>
            </HStack>
          </Button>
        )}
      </li>
    </ul>
  );
}
