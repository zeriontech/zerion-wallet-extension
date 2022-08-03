import React from 'react';
import { SeedType } from 'src/shared/SeedType';
import { AddressText } from 'src/ui/components/AddressText';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';

function WarningIcon({
  glow = false,
  style,
}: {
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        userSelect: 'none',
        width: 16,
        height: 16,
        borderRadius: '50%',
        color: 'var(--notice-500)',
        border: '2px solid var(--notice-500)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        boxShadow: glow ? '0 0 0px 3px var(--notice-400)' : undefined,
        ...style,
      }}
    >
      !
    </div>
  );
}

export function BackupFlowSettingsSection() {
  const { data: walletGroups, isLoading } = useWalletGroups();
  const notBackedUpGroups = walletGroups?.filter(
    (group) => group.lastBackedUp == null
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
                        <AddressText as="span" address={wallet.address} />
                      </UIText>
                    </HStack>
                  ))}
                </VStack>
                <div>
                  <Button
                    as={UnstyledLink}
                    to={`/backup-wallet?groupId=${group.id}`}
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
