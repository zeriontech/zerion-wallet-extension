import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { SurfaceList, type Item } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import { CopyButton } from 'src/ui/components/CopyButton';
import * as styles from './styles.module.css';

export function WalletList({
  walletGroups,
  selectedAddress,
  showAddressValues,
  onSelect,
}: {
  walletGroups: WalletGroup[];
  selectedAddress: string;
  showAddressValues: boolean;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  const items: Item[] = [];
  /**
   * If CSS anchor positioning is supported, we use it to avoid
   * nesting buttons, which is invalid per html spec, but still works ¯\_(ツ)_/¯
   */
  const supportsCssAnchor = CSS.supports('anchor-name: --name');
  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      const key = `${group.id}-${wallet.address}`;
      const COPY_BUTTON_SIZE = 20;
      const copyButton = (
        <CopyButton
          address={wallet.address}
          onClick={(event) => {
            if (!supportsCssAnchor) {
              event.stopPropagation();
            }
          }}
          className={styles.showOnHover}
          btnStyle={{ padding: 0, display: 'block' }}
          tooltipPosition="center-bottom"
          style={
            supportsCssAnchor
              ? {
                  position: 'absolute',
                  ['positionAnchor' as string]: `--button-slot-${key}`,
                  ['insetArea' as string]: 'center',
                }
              : undefined
          }
        />
      );
      items.push({
        key,
        isInteractive: true,
        pad: false,
        component: (
          <>
            <UnstyledButton
              className={styles.wallet}
              style={{
                padding: 12,
                borderRadius: 20,
                width: '100%',
                marginBlock: 4,
              }}
              onClick={() => {
                onSelect(wallet);
              }}
            >
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <Media
                  vGap={0}
                  image={
                    <IsConnectedToActiveTab
                      address={wallet.address}
                      render={({ data: isConnected }) => (
                        <WalletAvatar
                          address={wallet.address}
                          size={40}
                          active={Boolean(isConnected)}
                          borderRadius={4}
                          icon={
                            <WalletSourceIcon
                              address={wallet.address}
                              groupId={group.id}
                              style={{ width: 16, height: 16 }}
                            />
                          }
                        />
                      )}
                    />
                  }
                  text={
                    <UIText kind="small/regular">
                      <WalletDisplayName
                        wallet={wallet}
                        render={(data) => (
                          <>
                            <span style={{ wordBreak: 'break-all' }}>
                              {data.value}
                            </span>
                            {showAddressValues &&
                            data.type !== WalletNameType.address ? (
                              <>
                                <span style={{ color: 'var(--neutral-500)' }}>
                                  {` · ${truncateAddress(wallet.address)}`}
                                </span>
                              </>
                            ) : null}{' '}
                            {supportsCssAnchor ? (
                              <span
                                // This is a "slot" where copyButton will visually appear
                                style={{
                                  display: 'inline-block',
                                  width: COPY_BUTTON_SIZE,
                                  height: COPY_BUTTON_SIZE,
                                  ['anchorName' as string]: `--button-slot-${key}`,
                                  verticalAlign: 'bottom',
                                }}
                              ></span>
                            ) : (
                              copyButton
                            )}
                          </>
                        )}
                      />
                    </UIText>
                  }
                  detailText={
                    <PortfolioValue
                      address={wallet.address}
                      render={(entry) => (
                        <UIText kind="headline/h3">
                          {entry.value ? (
                            <NeutralDecimals
                              parts={formatCurrencyToParts(
                                entry.value?.total_value || 0,
                                'en',
                                'usd'
                              )}
                            />
                          ) : (
                            NBSP
                          )}
                        </UIText>
                      )}
                    />
                  }
                />
                {wallet.address.toLowerCase() ===
                selectedAddress.toLowerCase() ? (
                  <CheckIcon style={{ width: 24, height: 24 }} />
                ) : null}
              </HStack>
            </UnstyledButton>
            {supportsCssAnchor ? copyButton : null}
          </>
        ),
      });
    }
  }

  return <SurfaceList items={items} style={{ padding: 0 }} />;
}
