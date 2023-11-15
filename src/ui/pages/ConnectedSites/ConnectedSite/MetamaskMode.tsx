import React from 'react';
import MetamaskIcon from 'jsx:src/ui/assets/metamask.svg';
import MetamaskDisabledIcon from 'jsx:src/ui/assets/metamask_disabled.svg';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { reloadActiveTab } from 'src/ui/shared/reloadActiveTab';
import { useWalletNameFlags } from 'src/ui/shared/requests/useWalletNameFlags';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';

export function MetamaskMode({
  originName,
  onClick,
}: {
  originName: string;
  onClick?(): void;
}) {
  const { setWalletNameFlags, isMetaMask } = useWalletNameFlags(originName);

  return (
    <HStack gap={4} justifyContent="space-between" alignItems="center">
      <Media
        vGap={0}
        image={React.createElement(
          isMetaMask ? MetamaskIcon : MetamaskDisabledIcon,
          {
            style: {
              display: 'block',
              width: 32,
              height: 32,
            },
          }
        )}
        text={<UIText kind="body/accent">MetaMask Mode</UIText>}
        detailText={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Enable if Dapp only works with MetaMask
          </UIText>
        }
      />
      <Toggle
        checked={isMetaMask}
        onClick={onClick}
        onChange={(event) => {
          setWalletNameFlags
            .mutateAsync({
              flag: WalletNameFlag.isMetaMask,
              checked: event.target.checked,
            })
            .then(reloadActiveTab);
        }}
      />
    </HStack>
  );
}
