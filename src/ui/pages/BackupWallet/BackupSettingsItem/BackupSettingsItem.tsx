import React from 'react';
import { SeedType } from 'src/shared/SeedType';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
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
    <SurfaceList
      items={notBackedUpGroups
        .filter((group) => group.walletContainer.seedType == SeedType.mnemonic)
        .filter((group) => group.lastBackedUp == null)
        .map((group) => ({
          key: group.id,
          component: (
            <HStack gap={8}>
              <WarningIcon
                glow={true}
                style={{ position: 'relative', top: 4 }}
              />
              <VStack gap={8} style={{ color: 'var(--notice-600)' }}>
                <VStack gap={4}>
                  <UIText kind="subtitle/l_med">Secure Your Wallet</UIText>
                  <UIText kind="subtitle/m_reg">
                    You will lose access to your funds forever if your device is
                    lost or stolen
                  </UIText>
                </VStack>
                <VStack gap={4} style={{ color: 'var(--black)' }}>
                  {group.walletContainer.wallets.map((wallet) => (
                    <HStack key={wallet.address} gap={4} alignItems="center">
                      <BlockieImg address={wallet.address} size={16} />
                      <UIText kind="caption/reg">
                        <WalletDisplayName wallet={wallet} />
                      </UIText>
                    </HStack>
                  ))}
                </VStack>
                <div>
                  <Button
                    as={UnstyledLink}
                    to={`/backup-wallet?groupId=${group.id}&backupKind=verify`}
                    size={28}
                    style={{ paddingLeft: 12, paddingRight: 12 }}
                  >
                    Back Up Now (~1 min)
                  </Button>
                </div>
              </VStack>
            </HStack>
          ),
        }))}
    />
  );
}

// export function BackupSettingsItem() {
//   const { data: lastBackedUp } = useLastBackedUp();
//   return (
//     <HStack gap={8} alignItems="center">
//       {lastBackedUp == null ? <WarningIcon /> : null}
//       <VStack gap={0}>
//         <span>Back Up Wallet</span>
//
//         {lastBackedUp ? (
//           <UIText
//             kind="caption/reg"
//             color="var(--neutral-500)"
//             style={{
//               overflow: 'hidden',
//               maxWidth: 336,
//               textOverflow: 'ellipsis',
//               whiteSpace: 'nowrap',
//             }}
//           >
//             Last Backup:{' '}
//             {new Intl.DateTimeFormat('en', {
//               dateStyle: 'medium',
//             }).format(lastBackedUp)}
//           </UIText>
//         ) : null}
//       </VStack>
//     </HStack>
//   );
// }
