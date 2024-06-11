import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { NBSP } from 'src/ui/shared/typography';
import { Media } from 'src/ui/ui-kit/Media';
import type { UITextProps } from 'src/ui/ui-kit/UIText';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { WalletDisplayName } from '../WalletDisplayName';
import { WalletAvatar } from '../WalletAvatar';

export enum Composition {
  nameAndPortfolio,
  name,
}

interface CommonProps {
  wallet: ExternallyOwnedAccount;
  activeIndicator: boolean;
  iconSize: number;
  textKind?: UITextProps['kind'];
  detailTextKind?: UITextProps['kind'];
}

function NameAndPortfolioComposition({
  wallet,
  activeIndicator,
  iconSize,
  textKind = 'body/regular',
  detailTextKind = 'caption/regular',
  portfolio = true,
}: CommonProps & { portfolio?: boolean }) {
  const { currency } = useCurrency();

  return (
    <Media
      image={
        activeIndicator ? (
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
        ) : (
          <WalletAvatar
            address={wallet.address}
            size={iconSize}
            active={false}
          />
        )
      }
      text={
        <UIText kind={textKind}>
          <WalletDisplayName wallet={wallet} />
        </UIText>
      }
      detailText={
        portfolio ? (
          <PortfolioValue
            address={wallet.address}
            render={(entry) => (
              <UIText kind={detailTextKind}>
                {entry.value
                  ? formatCurrencyValue(
                      entry.value?.total_value || 0,
                      'en',
                      currency
                    )
                  : NBSP}
              </UIText>
            )}
          />
        ) : null
      }
    />
  );
}

export function WalletMedia({
  wallet,
  composition,
  iconSize,
  activeIndicator,
  textKind,
  detailTextKind,
}: {
  composition: Composition;
} & CommonProps) {
  if (composition === Composition.nameAndPortfolio) {
    return (
      <NameAndPortfolioComposition
        wallet={wallet}
        iconSize={iconSize}
        activeIndicator={activeIndicator}
        textKind={textKind}
        detailTextKind={detailTextKind}
      />
    );
  } else if (composition === Composition.name) {
    return (
      <NameAndPortfolioComposition
        portfolio={false}
        wallet={wallet}
        iconSize={iconSize}
        activeIndicator={activeIndicator}
        textKind={textKind}
        detailTextKind={detailTextKind}
      />
    );
  }
  throw new Error('Unexpected Composition enum value');
}
