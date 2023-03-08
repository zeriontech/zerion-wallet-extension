import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { NBSP } from 'src/ui/shared/typography';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletDisplayName } from '../WalletDisplayName';
import { WalletAvatar } from '../WalletAvatar';

export enum Composition {
  nameAndPortfolio,
}

interface CommonProps {
  wallet: BareWallet;
  activeIndicator: boolean;
  iconSize: number;
}

function NameAndPortfolioComposition({
  wallet,
  activeIndicator,
  iconSize,
}: CommonProps) {
  return (
    <Media
      image={
        <IsConnectedToActiveTab
          address={wallet.address}
          render={({ data: isConnected }) => (
            <WalletAvatar
              address={wallet.address}
              size={iconSize}
              active={Boolean(activeIndicator && isConnected)}
            />
          )}
        />
      }
      text={<WalletDisplayName wallet={wallet} />}
      detailText={
        <PortfolioValue
          address={wallet.address}
          render={(entry) => (
            <UIText kind="caption/regular">
              {entry.value
                ? formatCurrencyValue(
                    entry.value?.total_value || 0,
                    'en',
                    'usd'
                  )
                : NBSP}
            </UIText>
          )}
        />
      }
    />
  );
}

export function WalletMedia({
  wallet,
  composition,
  iconSize,
  activeIndicator,
}: {
  composition: Composition;
} & CommonProps) {
  if (composition === Composition.nameAndPortfolio) {
    return (
      <NameAndPortfolioComposition
        wallet={wallet}
        iconSize={iconSize}
        activeIndicator={activeIndicator}
      />
    );
  }
  throw new Error('Unexpected Composition enum value');
}
