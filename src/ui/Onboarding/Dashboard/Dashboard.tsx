import React from 'react';
import cn from 'classnames';
import { Content } from 'react-area';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useQuery } from 'react-query';
import { checkWhitelistStatus } from '../checkWhitelistStatus';
import DialogIcon from '../assets/dialog.png';
import KeyIcon from '../assets/key.png';
import WalletIcon from '../assets/wallet.png';
import * as styles from './styles.module.css';
import { Preview } from './Preview';

interface ImportOptionConfig {
  icon: React.ReactNode;
  getLink(address?: string): string;
  title: string;
  comingSoon?: boolean;
}

function ImportOption({
  address,
  icon,
  getLink,
  title,
  comingSoon,
}: ImportOptionConfig & { address?: string }) {
  const content = (
    <VStack
      gap={24}
      className={cn(styles.importOption, { [styles.disabled]: comingSoon })}
    >
      <div className={styles.importIcon}>{icon}</div>
      <UIText
        kind="headline/h3"
        color={comingSoon ? 'var(--neutral-600)' : 'var(--black)'}
      >
        {title}
      </UIText>
      {comingSoon ? (
        <div>
          <Button
            kind="primary"
            size={40}
            disabled={true}
            style={{ padding: '0 20px' }}
          >
            Coming soon
          </Button>
        </div>
      ) : (
        <div>
          <Button as="div" kind="primary" size={40}>
            Import
          </Button>
        </div>
      )}
    </VStack>
  );

  if (comingSoon) {
    return content;
  }

  return <UnstyledLink to={getLink(address)}>{content}</UnstyledLink>;
}

const IMPORT_OPTIONS: ImportOptionConfig[] = [
  {
    title: 'Recovery phrase',
    icon: <img src={DialogIcon} alt="Recovery phrase" />,
    getLink: (address) => `/onboarding/import/${address}/phrase`,
  },
  {
    title: 'Private key',
    icon: <img src={KeyIcon} alt="Private key" />,
    getLink: (address) => `/onboarding/import/${address}/key`,
  },
  {
    title: 'Hardware wallet',
    icon: <img src={WalletIcon} alt="Hardware wallet" />,
    getLink: () => '',
    comingSoon: true,
  },
];

function ImportOptions({ address }: { address?: string }) {
  return (
    <VStack gap={20} className={styles.importOptions}>
      <UIText kind="headline/h2">
        How would you like to activate your wallet.
      </UIText>
      <HStack gap={16} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {IMPORT_OPTIONS.map((option) => (
          <ImportOption key={option.title} address={address} {...option} />
        ))}
      </HStack>
    </VStack>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { walletAddress } = useParams();

  const { data: isWhitelisted } = useQuery(
    `check waitlist status for ${walletAddress}`,
    async () => {
      if (!walletAddress) {
        return false;
      }
      return checkWhitelistStatus(walletAddress);
    },
    { enabled: Boolean(walletAddress) }
  );

  return (
    <>
      <Content name="header-end">
        <Button
          kind="regular"
          size={32}
          onClick={() => navigate('/')}
          style={{ padding: '0 16px' }}
        >
          <UIText kind="caption/accent">Change wallet</UIText>
        </Button>
      </Content>
      {walletAddress && isWhitelisted ? (
        <VStack gap={40}>
          <Preview address={walletAddress} isWhitelisted={true} />
          <ImportOptions address={walletAddress} />
        </VStack>
      ) : null}
    </>
  );
}
