import React from 'react';
import { Content } from 'react-area';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Preview } from './Preview';
import * as styles from './styles.module.css';
import DialogIcon from './dialog.png';
import KeyIcon from './key.png';
import WalletIcon from './wallet.png';

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
  return (
    <VStack gap={24} className={styles.importOption}>
      <div className={styles.importIcon}>{icon}</div>
      <UIText
        kind="headline/h3"
        color={comingSoon ? 'var(--neutral-600)' : 'var(--black)'}
      >
        {title}
      </UIText>
      {comingSoon ? (
        <Button kind="primary" size={40} disabled={true}>
          Coming soon
        </Button>
      ) : (
        <Button
          kind="primary"
          size={40}
          as={UnstyledLink}
          to={getLink(address)}
        >
          Import
        </Button>
      )}
    </VStack>
  );
}

const IMPORT_OPTIONS: ImportOptionConfig[] = [
  {
    title: 'Recovery phrase',
    icon: <img src={DialogIcon} alt="Recovery phrase" />,
    getLink: (address) => '',
  },
  {
    title: 'Private key',
    icon: <img src={KeyIcon} alt="Private key" />,
    getLink: (address) => '',
  },
  {
    title: 'Hardware wallet',
    icon: <img src={WalletIcon} alt="Hardware wallet" />,
    getLink: (address) => '',
    comingSoon: true,
  },
];

function ImportOptions({ address }: { address?: string }) {
  return (
    <VStack gap={20}>
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
      {walletAddress ? (
        <VStack gap={40}>
          <Preview address={walletAddress} />
          <ImportOptions address={walletAddress} />
        </VStack>
      ) : null}
    </>
  );
}
