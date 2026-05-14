import React from 'react';
import type { AddressBookEntry } from 'src/background/Wallet/model/types';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { middot } from 'src/ui/shared/typography';
import * as styles from './styles.module.css';

export function AddressBookRow({
  entry,
  rightSlot,
  showAddressHint = true,
}: {
  entry: AddressBookEntry;
  rightSlot?: React.ReactNode;
  showAddressHint?: boolean;
}) {
  const ecosystemPrefix =
    getAddressType(entry.address) === 'evm' ? 'Eth' : 'Sol';
  const wallet = { address: entry.address, name: entry.name ?? null };

  return (
    <div className={styles.row}>
      <VStack gap={0}>
        <HStack
          gap={4}
          justifyContent="space-between"
          alignItems="center"
          style={{ padding: 12 }}
        >
          <Media
            vGap={0}
            image={
              <WalletAvatar
                address={entry.address}
                size={40}
                active={false}
                borderRadius={12}
              />
            }
            text={
              <UIText kind="small/regular">
                <WalletDisplayName
                  wallet={wallet}
                  render={(data) => (
                    <span
                      style={{
                        wordBreak: 'break-all',
                        verticalAlign: 'middle',
                      }}
                    >
                      {`${
                        data.type !== WalletNameType.domain
                          ? `${ecosystemPrefix} ${middot} `
                          : ''
                      }${data.value}`}
                    </span>
                  )}
                />
              </UIText>
            }
            detailText={
              showAddressHint && entry.name ? (
                <UIText kind="small/regular" color="var(--neutral-500)">
                  {truncateAddress(entry.address, 5)}
                </UIText>
              ) : null
            }
          />
          {rightSlot}
        </HStack>
      </VStack>
    </div>
  );
}
