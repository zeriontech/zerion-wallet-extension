import React from 'react';
import cn from 'classnames';
import type { BareWallet, MaskedBareWallet } from 'src/shared/types/BareWallet';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { animated, useSpring } from '@react-spring/web';
import { HStack } from 'src/ui/ui-kit/HStack';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { WalletNameType } from 'src/ui/shared/useProfileName';
import { middot } from 'src/ui/shared/typography';
import { WithConfetti } from './WithConfetti';
import * as styles from './styles.module.css';

export function ImportBackground({ animate }: { animate: boolean }) {
  return (
    <div
      className={cn(styles.animatedDecoration, styles.fancyBackground)}
      style={{ animationPlayState: animate ? 'running' : 'paused' }}
    />
  );
}

function WalletItem({ wallet }: { wallet: MaskedBareWallet | BareWallet }) {
  const ecosystemPrefix =
    getAddressType(wallet.address) === 'evm' ? 'Eth' : 'Sol';

  return (
    <HStack
      gap={8}
      alignItems="center"
      style={{
        padding: 8,
        backgroundColor: 'var(--neutral-200)',
        borderRadius: 8,
      }}
    >
      <WalletAvatar address={wallet.address} size={32} borderRadius={8} />
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
    </HStack>
  );
}

function WalletList({
  wallets,
}: {
  wallets: (MaskedBareWallet | BareWallet)[];
}) {
  const isMultiple = wallets.length > 1;
  const restWaleltsCount = Math.max(wallets.length - 3, 0);

  const style = useSpring({
    opacity: 1,
    transform: 'scale(1)',
    from: { opacity: 0, transform: 'scale(0.5)' },
    config: { tension: 200, friction: 20 },
  });

  return (
    <animated.div style={{ ...style, width: '100%' }}>
      <VStack
        gap={16}
        style={{ padding: 16, borderRadius: 12, background: 'var(--white' }}
      >
        <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
          {isMultiple ? 'Your wallets are ready' : 'Your wallet is ready'}
        </UIText>
        <VStack gap={8}>
          {wallets.slice(0, 3).map((wallet, index) => (
            <WalletItem key={index} wallet={wallet} />
          ))}
          {wallets.length === 4 ? (
            <WalletItem wallet={wallets[3]} />
          ) : wallets.length > 4 ? (
            <HStack
              gap={8}
              alignItems="center"
              style={{
                padding: 8,
                backgroundColor: 'var(--neutral-200)',
                borderRadius: 8,
              }}
            >
              <WalletIcon style={{ width: 32, height: 32 }} />
              <UIText kind="body/regular" color="var(--neutral-800)">
                +{restWaleltsCount} wallets more
              </UIText>
            </HStack>
          ) : null}
        </VStack>
      </VStack>
    </animated.div>
  );
}

export function ImportDecoration({
  wallets,
  isLoading,
  loadingTitle,
}: {
  wallets: (MaskedBareWallet | BareWallet)[];
  isLoading: boolean;
  loadingTitle: string;
}) {
  return (
    <div
      style={{
        flexGrow: 1,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isLoading ? (
        <UIText kind="headline/h3" className={styles.gradientText}>
          {loadingTitle}
        </UIText>
      ) : (
        <WithConfetti>
          <WalletList wallets={wallets} />
        </WithConfetti>
      )}
    </div>
  );
}
