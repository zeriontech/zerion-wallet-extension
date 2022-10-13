import React, { useState } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { BareWallet } from 'src/shared/types/BareWallet';
import {
  Item,
  SurfaceItemButton,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { getIndexFromPath } from 'src/shared/wallet/getNextAccountPath';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';

export function WalletList({
  wallets,
  existingAddressesSet,
  listTitle,
  showPortfolio,
  values,
  onSelect,
  initialCount,
}: {
  wallets: BareWallet[];
  existingAddressesSet: Set<string>;
  listTitle: React.ReactNode;
  showPortfolio: boolean;
  values: Set<string>;
  onSelect: (value: string) => void;
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount ?? wallets.length);
  return (
    <VStack gap={8}>
      {listTitle ? <UIText kind="small/accent">{listTitle}</UIText> : null}
      <SurfaceList
        items={wallets
          .slice(0, count)
          .map<Item>((wallet) => ({
            key: wallet.address,

            onClick: existingAddressesSet.has(normalizeAddress(wallet.address))
              ? undefined
              : () => onSelect(wallet.address),
            component: (
              <HStack
                gap={8}
                alignItems="center"
                justifyContent="space-between"
                style={{
                  gridTemplateColumns: 'minmax(min-content, 18px) 1fr auto',
                }}
              >
                <UIText
                  kind="body/regular"
                  color="var(--neutral-500)"
                  title={`Derivation path: ${wallet.mnemonic?.path}`}
                  style={{ cursor: 'help' }}
                >
                  {wallet.mnemonic
                    ? getIndexFromPath(wallet.mnemonic.path)
                    : null}
                </UIText>
                <Media
                  image={
                    <WalletIcon
                      address={wallet.address}
                      active={false}
                      iconSize={40}
                    />
                  }
                  text={<WalletDisplayName wallet={wallet} />}
                  vGap={0}
                  detailText={
                    showPortfolio ? (
                      <UIText kind="headline/h3">
                        <PortfolioValue
                          address={wallet.address}
                          render={({ value }) =>
                            value ? (
                              <NeutralDecimals
                                parts={formatCurrencyToParts(
                                  value.total_value,
                                  'en',
                                  'usd'
                                )}
                              />
                            ) : (
                              <span>{NBSP}</span>
                            )
                          }
                        />
                      </UIText>
                    ) : null
                  }
                />
                {existingAddressesSet.has(normalizeAddress(wallet.address)) ? (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Already added
                  </UIText>
                ) : (
                  <span>
                    <AnimatedCheckmark
                      checked={values.has(wallet.address)}
                      checkedColor="var(--primary)"
                    />
                  </span>
                )}
              </HStack>
            ),
          }))
          .concat(
            count < wallets.length
              ? [
                  {
                    key: -1,
                    isInteractive: true,
                    pad: false,
                    component: (
                      <SurfaceItemButton
                        onClick={() => setCount((count) => count + 3)}
                      >
                        <UIText kind="body/regular" color="var(--primary)">
                          {count === 0 ? 'Show' : 'Show More'}
                        </UIText>
                      </SurfaceItemButton>
                    ),
                  },
                ]
              : []
          )}
      />
    </VStack>
  );
}
