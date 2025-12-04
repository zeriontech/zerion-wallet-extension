import browser from 'webextension-polyfill';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import FundIcon from 'jsx:src/ui/assets/actions/fund.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actions/receive.svg';
import BuyIcon from 'jsx:src/ui/assets/actions/buy.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { walletPort } from 'src/ui/shared/channels';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { WithMainnetOnlyWarningDialog } from 'src/ui/features/testnet-mode/MainnetOnlyWarningDialog';
import { type HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { emitter } from 'src/ui/shared/events';
import {
  ONRAMP_EXPERIMENT_NAME,
  useStatsigExperiment,
} from 'src/modules/statsig/statsig.client';
import { AddFundsOptionsDialog } from '../../Receive/AddFundsOptionsDialog';
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
  title: React.AnchorHTMLAttributes<HTMLAnchorElement>['title'];
} & { as?: As } & ComponentPropsWithoutRef<As>) {
  const Element = as || UnstyledAnchor;
  return (
    <Element {...props} className={classNames(s.actionButton, className)}>
      <div className={s.icon} title={title}>
        {icon}
      </div>
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
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  const addWalletParams = useWalletParams(wallet);
  const fundOptionsDialogRef = useRef<HTMLDialogElementInterface>(null);
  const { handleAnchorClick } = useOpenAndConnectToZerion({
    address: wallet?.address ?? null,
  });

  const statsigExperimentQuery = useStatsigExperiment(ONRAMP_EXPERIMENT_NAME);
  if (statsigExperimentQuery.isLoading) {
    return <div style={{ height: 48 }} />;
  }

  if (!addWalletParams || !wallet) {
    return null;
  }

  const receiveButton = (
    <ActionButton
      title="Receive"
      as={UnstyledLink}
      icon={<ReceiveIcon />}
      to={`/receive?address=${wallet.address}`}
    />
  );
  const sendButton = (
    <ActionButton
      title="Send"
      as={UnstyledLink}
      icon={<SendIcon />}
      to="/send-form"
    />
  );

  const bridgeButton = (
    <WithMainnetOnlyWarningDialog<'a'>
      message="Testnets are not supported in Bridge"
      render={({ handleClick }) => (
        <ActionButton
          title="Bridge"
          as={UnstyledLink}
          icon={<BridgeIcon />}
          to="/bridge-form"
          onClick={(event) => {
            handleClick(event);
          }}
        />
      )}
    />
  );
  const fundButton = (
    <ActionButton
      title="Fund"
      as={UnstyledButton}
      icon={<FundIcon />}
      onClick={() => {
        fundOptionsDialogRef.current?.showModal();

        emitter.emit('buttonClicked', {
          buttonName: 'Fund',
          buttonScope: 'General',
          pathname,
          walletAddress: wallet.address,
        });
      }}
    />
  );

  const buyButton = (
    <ActionButton
      title="Buy"
      icon={<BuyIcon />}
      href={`${ZERION_ORIGIN}/deposit?${addWalletParams}`}
      onClick={handleAnchorClick}
      target="_blank"
      rel="noopener noreferrer"
    />
  );
  return (
    <div>
      <AddFundsOptionsDialog
        dialogRef={fundOptionsDialogRef}
        wallet={wallet}
        analytics={{ pathname, address: wallet.address }}
      />
      <ul
        className={s.list}
        style={{
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {statsigExperimentQuery.data?.group_name == 'test' ? (
          <>
            <li>{fundButton}</li>
            <li>{sendButton}</li>
            <li>{bridgeButton}</li>
          </>
        ) : (
          <>
            <li>{sendButton}</li>
            <li>{receiveButton}</li>
            <li>{bridgeButton}</li>
            <li>{buyButton}</li>
          </>
        )}
        <li style={{ flexGrow: 1, minWidth: 0 }}>
          <WithMainnetOnlyWarningDialog<'a'>
            message="Testnets are not supported in Swap"
            render={({ handleClick }) => (
              <Button
                aria-label="Swap"
                size={48}
                as={UnstyledLink}
                onClick={(event) => {
                  handleClick(event);
                }}
                to="/swap-form"
                style={{
                  borderRadius: 24,
                  width: '100%',
                  paddingInline: 0,
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
        </li>
      </ul>
    </div>
  );
}
