import browser from 'webextension-polyfill';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import SwapIcon from 'jsx:src/ui/assets/actions/swap-2.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send-2.svg';
import BuyIcon from 'jsx:src/ui/assets/actions/card.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actions/qr-code.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { walletPort } from 'src/ui/shared/channels';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WithMainnetOnlyWarningDialog } from 'src/ui/features/testnet-mode/MainnetOnlyWarningDialog';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { emitter } from 'src/ui/shared/events';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { ReceiverAddressDialog } from 'src/ui/components/ReceiverAddressDialog';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from './styles.module.css';

const ZERION_ORIGIN = 'https://app.zerion.io';

function ActionButton<As extends ElementType = 'a'>({
  as,
  icon,
  title,
  className,
  ...props
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
} & { as?: As } & ComponentPropsWithoutRef<As>) {
  const Element = as || UnstyledAnchor;
  return (
    <Element {...props} className={classNames(s.actionButton, className)}>
      <VStack gap={0} style={{ justifyItems: 'center' }}>
        <div className={s.icon}>{icon}</div>
        <UIText kind="caption/accent">{title}</UIText>
      </VStack>
    </Element>
  );
}

function acceptOrigin(params: { address: string; origin: string }) {
  return walletPort.request('acceptOrigin', params);
}

export function useOpenAndConnectToZerion({
  address,
}: {
  address: string | null;
}) {
  const { data: activeTabs } = useQuery({
    queryKey: ['browser/activeTab'],
    queryFn: () => browser.tabs.query({ active: true, currentWindow: true }),
  });
  const activeTab = activeTabs ? activeTabs[0] : null;
  const handleAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!address) {
      return;
    }
    acceptOrigin({ origin: ZERION_ORIGIN, address });
    const href = event.currentTarget.getAttribute('href');
    const activeTabUrl = activeTab?.url ? new URL(activeTab.url) : null;
    if (href && activeTab && activeTabUrl?.origin == ZERION_ORIGIN) {
      event.preventDefault();
      browser.tabs.update(activeTab.id, { url: href });
    }
  };
  return { handleAnchorClick };
}

export function ActionButtonsRow() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  const addWalletParams = useWalletParams(wallet);
  const recipientDialog = useDialog2();
  const { handleAnchorClick } = useOpenAndConnectToZerion({
    address: wallet?.address ?? null,
  });

  if (!addWalletParams || !wallet) {
    return null;
  }

  const buyCryptoHref = `${ZERION_ORIGIN}/deposit?${addWalletParams}`;

  const buyButton = (
    <ActionButton
      title="Buy"
      icon={<BuyIcon />}
      href={buyCryptoHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
        handleAnchorClick(event);
        emitter.emit('buttonClicked', {
          buttonName: 'Buy Crypto',
          buttonScope: 'General',
          pathname,
          walletAddress: wallet.address,
        });
      }}
    />
  );

  const receiveButton = (
    <ActionButton
      title="Receive"
      as={UnstyledLink}
      icon={<ReceiveIcon />}
      to={`/receive?address=${wallet.address}`}
      onClick={() => {
        emitter.emit('buttonClicked', {
          buttonName: 'Receive Crypto',
          buttonScope: 'General',
          pathname,
          walletAddress: wallet.address,
        });
      }}
    />
  );

  const sendButton = (
    <ActionButton
      title="Send"
      as={UnstyledButton}
      icon={<SendIcon />}
      onClick={() => recipientDialog.openDialog()}
    />
  );

  return (
    <div>
      <ReceiverAddressDialog
        open={recipientDialog.open}
        onClose={recipientDialog.closeDialog}
        title="Recipient"
        onSelect={(address) => {
          navigate(`/send-form?to=${address}`);
        }}
      />
      <ul
        className={s.list}
        style={{
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        <li>{buyButton}</li>
        <li>{receiveButton}</li>
        <li>{sendButton}</li>
        <li>
          <WithMainnetOnlyWarningDialog<'a'>
            message="Testnets are not supported in Swap"
            render={({ handleClick }) => (
              <ActionButton
                title="Swap"
                as={UnstyledLink}
                className={s.actionButtonPrimary}
                icon={<SwapIcon />}
                to="/swap-form"
                onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                  handleClick(event);
                }}
              />
            )}
          />
        </li>
      </ul>
    </div>
  );
}
