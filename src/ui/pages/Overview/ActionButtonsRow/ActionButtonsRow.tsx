import React, { ComponentPropsWithoutRef, ElementType, useMemo } from 'react';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actions/receive.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import BuyIcon from 'jsx:src/ui/assets/actions/buy.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useMutation, useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';

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
    <Element {...props}>
      <VStack gap={4} style={{ placeItems: 'center' }}>
        <div
          style={{
            height: 44,
            width: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: `1px solid var(--neutral-400)`,
          }}
          title={title}
        >
          {icon}
        </div>
        {title}
      </VStack>
    </Element>
  );
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
  if (!addWalletParams || !wallet) {
    return null;
  }
  const addPermission = () =>
    acceptOrigin({
      origin: 'http://localhost:3000',
      address: wallet.address,
    });
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
          href={`http://localhost:3000/swap?${addWalletParams}`}
          onClick={addPermission}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Send"
          icon={<SendIcon />}
          href={`http://localhost:3000/send?${addWalletParams}`}
          onClick={addPermission}
          target="_blank"
          rel="noopener noreferrer"
        />
      </li>
      <li>
        <ActionButton
          title="Receive"
          as={UnstyledLink}
          icon={<ReceiveIcon />}
          to="/not-implemented"
        />
      </li>
      <li>
        <ActionButton
          title="Bridge"
          icon={<BridgeIcon />}
          href={`http://localhost:3000/bridge?${addWalletParams}`}
          onClick={addPermission}
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
