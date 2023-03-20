import React from 'react';
import cn from 'classnames';
import { Content } from 'react-area';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useWhitelistStatus } from '../checkWhitelistStatus';
import DialogIcon from '../assets/dialog.png';
import KeyIcon from '../assets/key.png';
import WalletIcon from '../assets/wallet.png';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
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
  const { isNarrowView } = useSizeStore();
  const content = (
    <VStack
      gap={24}
      className={cn(styles.importOption, { [styles.disabled]: comingSoon })}
    >
      <Stack
        direction={isNarrowView ? 'horisontal' : 'vertical'}
        gap={isNarrowView ? 8 : 16}
        style={{ alignItems: isNarrowView ? 'center' : undefined }}
      >
        <div className={styles.importIcon}>{icon}</div>
        <UIText
          kind="headline/h3"
          color={comingSoon ? 'var(--neutral-600)' : 'var(--black)'}
        >
          {title}
        </UIText>
      </Stack>
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
    getLink: (address) => `/onboarding/import/${address}/mnemonic`,
  },
  {
    title: 'Private key',
    icon: <img src={KeyIcon} alt="Private key" />,
    getLink: (address) => `/onboarding/import/${address}/private-key`,
  },
  {
    title: 'Hardware wallet',
    icon: <img src={WalletIcon} alt="Hardware wallet" />,
    getLink: () => '',
    comingSoon: true,
  },
];

function ImportOptions({ address }: { address?: string }) {
  const { isNarrowView } = useSizeStore();
  return (
    <VStack gap={isNarrowView ? 16 : 20} className={styles.importOptions}>
      <UIText
        kind={isNarrowView ? 'body/accent' : 'headline/h2'}
        color={isNarrowView ? 'var(--neutral-600)' : 'var(--black)'}
      >
        How would you like to activate your wallet.
      </UIText>
      <Stack
        gap={16}
        direction={isNarrowView ? 'vertical' : 'horisontal'}
        style={{
          gridTemplateColumns: isNarrowView ? undefined : '1fr 1fr 1fr',
        }}
      >
        {IMPORT_OPTIONS.map((option) => (
          <ImportOption key={option.title} address={address} {...option} />
        ))}
      </Stack>
    </VStack>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { walletAddress } = useParams();

  const { status: isWhitelisted, isLoading } =
    useWhitelistStatus(walletAddress);

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
      {walletAddress && !isLoading ? (
        <VStack gap={40}>
          <Preview
            address={walletAddress}
            isWhitelisted={Boolean(isWhitelisted)}
          />
          {isWhitelisted ? <ImportOptions address={walletAddress} /> : null}
        </VStack>
      ) : null}
    </>
  );
}
