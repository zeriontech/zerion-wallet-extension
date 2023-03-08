import React from 'react';
import { SeedType } from 'src/shared/SeedType';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';

export function BackupFlowSettingsSection() {
  const { data: walletGroups, isLoading } = useWalletGroups();
  const notBackedUpGroups = walletGroups?.filter(
    (group) =>
      group.walletContainer.seedType === SeedType.mnemonic &&
      group.origin === WalletOrigin.extension &&
      group.lastBackedUp == null
  );
  if (isLoading || !notBackedUpGroups || !notBackedUpGroups.length) {
    return null;
  }

  return (
    <Surface padding={12} style={{ backgroundColor: 'var(--notice-100)' }}>
      <HStack gap={8}>
        <WarningIcon
          outlineStrokeWidth={5}
          size={32}
          glow={true}
          style={{ position: 'relative', top: 4 }}
        />
        <div>
          <VStack gap={4}>
            <UIText kind="body/accent" color="var(--notice-600)">
              Secure Your Wallet
            </UIText>
            <UIText kind="small/regular" color="var(--neutral-700)">
              You will lose access to your funds forever if your device is lost
              or stolen
            </UIText>
          </VStack>
          <Spacer height={16} />
          <VStack gap={24}>
            {notBackedUpGroups
              .filter(
                (group) => group.walletContainer.seedType == SeedType.mnemonic
              )
              .filter((group) => group.lastBackedUp == null)
              .map((group) => (
                <VStack
                  key={group.id}
                  gap={8}
                  style={{ color: 'var(--notice-600)' }}
                >
                  <VStack gap={4} style={{ color: 'var(--black)' }}>
                    {group.walletContainer.wallets.map((wallet) => (
                      <HStack key={wallet.address} gap={4} alignItems="center">
                        <WalletAvatar
                          address={wallet.address}
                          size={16}
                          borderRadius={4}
                        />
                        <UIText kind="caption/regular">
                          <WalletDisplayName wallet={wallet} />
                        </UIText>
                      </HStack>
                    ))}
                  </VStack>
                  <div>
                    <Button
                      as={UnstyledLink}
                      to={`/backup-wallet?groupId=${group.id}&backupKind=verify`}
                      size={32}
                      style={{ paddingLeft: 16, paddingRight: 16 }}
                    >
                      Back Up Now (~1 min)
                    </Button>
                  </div>
                </VStack>
              ))}
          </VStack>
        </div>
      </HStack>
    </Surface>
  );
}
