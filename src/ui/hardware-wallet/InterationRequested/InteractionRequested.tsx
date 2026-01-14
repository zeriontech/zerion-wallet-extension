import React from 'react';
import type { UserInteractionRequested } from '@zeriontech/hardware-wallet-connection';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { UIText } from 'src/ui/ui-kit/UIText';
import LockIcon from 'jsx:../../assets/lock-outline.svg';
import ConnectIcon from 'jsx:../../assets/technology-connect.svg';
import EcosystemEthereumIcon from 'jsx:../../assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:../../assets/ecosystem-solana.svg';
import EditIcon from 'jsx:../../assets/edit.svg';
import CheckIcon from 'jsx:../../assets/check.svg';
import WalletIcon from 'jsx:../../assets/wallet.svg';
import EyeIcon from 'jsx:../../assets/eye.svg';
import ShieldIcon from 'jsx:../../assets/shield.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

const INTERACTION_CONFIG: Record<
  UserInteractionRequested,
  {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    shake?: boolean;
  }
> = {
  none: { title: '', icon: WalletIcon },
  'unlock-device': { title: 'Unlock Device', icon: LockIcon, shake: true },
  'allow-secure-connection': {
    title: 'Allow Secure Connection',
    icon: ConnectIcon,
    shake: true,
  },
  'confirm-open-app': {
    title: 'Confirm Open App',
    icon: EcosystemEthereumIcon,
    shake: true,
  },
  'sign-transaction': { title: 'Sign Transaction', icon: EditIcon },
  'sign-typed-data': { title: 'Sign Typed Data', icon: EditIcon },
  'allow-list-apps': { title: 'Allow List Apps', icon: WalletIcon },
  'verify-address': { title: 'Verify Address', icon: EyeIcon },
  'sign-personal-message': { title: 'Sign Personal Message', icon: EditIcon },
  'sign-delegation-authorization': {
    title: 'Sign Delegation Authorization',
    icon: CheckIcon,
  },
  'web3-checks-opt-in': { title: 'Web3 Checks Opt-in', icon: ShieldIcon },
  'verify-safe-address': { title: 'Verify Safe Address', icon: EyeIcon },
};

export function InteractionRequested({
  kind,
  ecosystem,
}: {
  kind: UserInteractionRequested;
  ecosystem: BlockchainType;
}) {
  const config = kind && kind !== 'none' ? INTERACTION_CONFIG[kind] : null;
  let IconComponent = config?.icon;

  if (kind === 'confirm-open-app') {
    IconComponent =
      ecosystem === 'solana' ? EcosystemSolanaIcon : EcosystemEthereumIcon;
  }

  if (!config || !IconComponent) {
    return null;
  }

  return (
    <VStack gap={16} style={{ justifyItems: 'center' }}>
      <div
        className={config.shake ? styles.iconShake : undefined}
        style={{ display: 'flex' }}
      >
        <IconComponent
          style={{ width: 60, height: 60, color: 'var(--black)' }}
        />
      </div>
      <VStack gap={0} style={{ justifyItems: 'center' }}>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Action on your device:
        </UIText>
        <UIText kind="body/accent">{config.title}</UIText>
      </VStack>
    </VStack>
  );
}
