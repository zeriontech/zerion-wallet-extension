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
import { isReadonlyAccount } from 'src/shared/types/validators';
import { walletPort } from 'src/ui/shared/channels';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WithMainnetOnlyWarningDialog } from 'src/ui/features/testnet-mode/MainnetOnlyWarningDialog';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { emitter } from 'src/ui/shared/events';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { ReceiverAddressDialog } from 'src/ui/components/ReceiverAddressDialog';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from './styles.module.css';

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

export function ActionButtonsRow() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  const recipientDialog = useDialog2();

  if (!wallet) {
    return null;
  }

  /**
   * Buying sends real money to this address. For one the user only watches, we
   * cannot know they hold its keys — so the affordance is absent rather than
   * disabled-with-an-explainer. Receive stays: transferring in from a wallet
   * they do control is the sane way to fund an address they are watching.
   */
  // Annotated `boolean` on purpose: `isReadonlyAccount` is a type predicate, and
  // letting it narrow would make `wallet` `never` in the non-readonly branch
  const isWatchedAddress: boolean = isReadonlyAccount(wallet);
  const buyButton = isWatchedAddress ? null : (
    <WithMainnetOnlyWarningDialog<'a'>
      message="Testnets are not supported in Buy Crypto"
      render={({ handleClick }) => (
        <ActionButton
          title="Buy"
          as={UnstyledLink}
          icon={<BuyIcon />}
          to="/deposit"
          onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
            handleClick(event);
            emitter.emit('buttonClicked', {
              buttonName: 'Buy Crypto',
              buttonScope: 'General',
              pathname,
              walletAddress: wallet.address,
            });
          }}
        />
      )}
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
        {buyButton ? <li>{buyButton}</li> : null}
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
