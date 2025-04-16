import React, { useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import RightAngleIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { apostrophe } from 'src/ui/shared/typography';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { Stack } from 'src/ui/ui-kit/Stack';
import lockIconSrc from 'url:src/ui/assets/lock.png';
import keyIconSrc from 'url:../assets/key.png';
import dialogIconSrc from 'url:../assets/dialog.png';
import metamaskIconSrc from 'url:../assets/metamask.png';
import phantomIconSrc from 'url:../assets/phantom-wallet-icon.svg';
import walletIconSrc from 'url:../assets/wallet2.png';
import { SidePanel } from '../shared/SidePanel';
import * as styles from './styles.module.css';

function PhantomWalletInstructionPanel({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  return (
    <SidePanel show={show} onDismiss={onDismiss}>
      <VStack gap={20}>
        <div className={styles.faqIcon}>
          <img src={phantomIconSrc} style={{ width: 20, height: 20 }} />
        </div>
        <VStack gap={16}>
          <UIText kind="body/accent">
            Where can I find my recovery phrase or private key?
          </UIText>
          <UIText kind="body/regular">
            1. Open your Phantom wallet extension
          </UIText>

          <UIText kind="body/regular">
            2. Click the top-left icon to open the side menu, then tap the
            pencil icon to manage accounts.
          </UIText>
          <div>
            <img
              style={{ width: 320 }}
              src="https://cdn.zerion.io/images/dna-assets/phantom-instruction-screenshot_2x.png"
              alt="Phantom wallet screenshot"
            />
          </div>
          <UIText kind="body/regular">
            3. Select the account, then choose to view your recovery phrase or
            private key.
          </UIText>
          <UIText kind="body/regular">
            4. Copy it and paste in Zerion extension 🎉
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-600)">
            Keys and recovery phrases are saved safely locally and not shared
            with us.
          </UIText>
        </VStack>
      </VStack>
    </SidePanel>
  );
}

export function SecretKeyFAQ() {
  const { isNarrowView } = useWindowSizeStore();
  const [helpPanel, setHelpPanel] = useState<
    'metamask' | 'phantom' | 'other' | null
  >(null);

  return (
    <>
      <SidePanel
        show={helpPanel === 'metamask'}
        onDismiss={() => setHelpPanel(null)}
      >
        <VStack gap={0}>
          <div className={styles.faqIcon}>
            <img src={metamaskIconSrc} style={{ width: 20, height: 20 }} />
          </div>
          <Spacer height={20} />
          <VStack gap={16}>
            <div>
              <UIText kind="body/accent">
                Where can I find my private key?
              </UIText>
              <Spacer height={8} />
              <UIText kind="body/regular">
                1. Open your MetaMask extension and look for the menu.
              </UIText>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'var(--z-index-1-inverted)',
              }}
            >
              <img
                src="https://cdn.zerion.io/images/dna-assets/metamask-instruction-screenshot_2x.png"
                style={{ width: 218 }}
                alt="Metamask wallet screenshot"
              />
            </div>
            <UIText kind="body/regular">
              2. Select account details and export private key.
            </UIText>
            <UIText kind="body/regular">
              3. Enter MM password and copy private key.
            </UIText>
            <UIText kind="body/regular">4. Paste in Zerion extension 🎉</UIText>
            <UIText kind="small/regular" color="var(--neutral-600)">
              Keys and recovery phrases are saved safely locally and not shared
              with us.
            </UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <PhantomWalletInstructionPanel
        show={helpPanel === 'phantom'}
        onDismiss={() => setHelpPanel(null)}
      />
      <SidePanel
        show={helpPanel === 'other'}
        onDismiss={() => setHelpPanel(null)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={walletIconSrc}
              style={{ width: 20, height: 20, borderRadius: 10 }}
            />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">Where can I find my private key?</UIText>
            <UIText kind="body/regular">
              1. To export your private key, open your existing wallet and head
              to the Settings or Menu.
            </UIText>

            <UIText kind="body/regular">
              2. Most wallets allow you to export your private key from the
              Security & Privacy section.
            </UIText>
            <UIText kind="body/regular">
              3. Click the Export Private Key option. You{apostrophe}ll then
              have to enter your wallet{apostrophe}s password.
            </UIText>
            <UIText kind="body/regular">
              4. Copy your private key and paste/ enter it in Zerion{apostrophe}
              s browser extension.
            </UIText>
            <UIText kind="body/regular">
              5. That{apostrophe}s it! You did it 🎉
            </UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <VStack gap={24} style={{ alignContent: 'start' }}>
        {isNarrowView ? null : (
          <div className={styles.faqIcon}>
            <img src={keyIconSrc} style={{ width: 20, height: 20 }} />
          </div>
        )}
        {isNarrowView ? null : (
          <VStack gap={8}>
            <UIText kind="small/regular">
              Your keys, your crypto. Always.
            </UIText>
            <UIText kind="small/regular" color="var(--neutral-600)">
              Zerion cannot access or save them. Your keys stay on this device
            </UIText>
          </VStack>
        )}
        <VStack gap={8}>
          <UIText kind="small/regular">Where can I find my private key?</UIText>
          <Stack gap={8} direction={isNarrowView ? 'horizontal' : 'vertical'}>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('metamask')}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={metamaskIconSrc} />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">MetaMask</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('phantom')}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={phantomIconSrc} />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">Phantom</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('other')}
            >
              <HStack gap={8} alignItems="center">
                <img
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  src={walletIconSrc}
                />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">Other wallets</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
          </Stack>
        </VStack>
      </VStack>
    </>
  );
}

export function PhraseFAQ() {
  const { isNarrowView } = useWindowSizeStore();
  const [helpPanel, setHelpPanel] = useState<
    'metamask' | 'phantom' | 'other' | null
  >(null);

  return (
    <>
      <SidePanel
        show={helpPanel === 'metamask'}
        onDismiss={() => setHelpPanel(null)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img src={metamaskIconSrc} style={{ width: 20, height: 20 }} />
          </div>
          <VStack gap={16}>
            <UIText kind="body/accent">
              Where can I find my recovery phrase?
            </UIText>
            <UIText kind="body/regular">
              1. Open your MetaMask extension and look for the menu.
            </UIText>
            <div>
              <img
                src="https://placehold.co/640x470"
                style={{ width: 320 }}
                alt="Metamask wallet screenshot"
              />
            </div>

            <UIText kind="body/regular">
              2. Select account details and export recovery phrase.
            </UIText>
            <UIText kind="body/regular">
              3. Enter MM password and copy recovery phrase.
            </UIText>
            <UIText kind="body/regular">4. Paste in Zerion extension 🎉</UIText>
            <UIText kind="small/regular" color="var(--neutral-600)">
              Keys and recovery phrases are saved safely locally and not shared
              with us.
            </UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <PhantomWalletInstructionPanel
        show={helpPanel === 'phantom'}
        onDismiss={() => setHelpPanel(null)}
      />
      <SidePanel
        show={helpPanel === 'other'}
        onDismiss={() => setHelpPanel(null)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={walletIconSrc}
              style={{ width: 20, height: 20, borderRadius: 10 }}
            />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">
              Where can I find my recovery phrase?
            </UIText>
            <UIText kind="body/regular">
              1. Open up your existing wallet, either on your mobile app or
              extension and open the Settings.
            </UIText>

            <UIText kind="body/regular">
              2. Copy your Recovery Phrase. It{apostrophe}s usually 12 or 24
              words long.
            </UIText>
            <UIText kind="body/regular">
              3. Enter in the Recovery Phrase that you copied down into the
              Zerion extension. Click on Import wallet once complete.
            </UIText>
            <UIText kind="body/regular">4. That{apostrophe}s it 🎉</UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <VStack gap={24} style={{ alignContent: 'start' }}>
        {isNarrowView ? null : (
          <div className={styles.faqIcon}>
            <img src={dialogIconSrc} style={{ width: 20, height: 20 }} />
          </div>
        )}
        <VStack gap={8}>
          <UIText kind="small/regular">
            Where can I find my recovery phrase?
          </UIText>
          <Stack gap={8} direction={isNarrowView ? 'horizontal' : 'vertical'}>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('metamask')}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={metamaskIconSrc} />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">MetaMask</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('phantom')}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={phantomIconSrc} />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">Phantom</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setHelpPanel('other')}
            >
              <HStack gap={8} alignItems="center">
                <img
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  src={walletIconSrc}
                />
                <HStack
                  gap={0}
                  alignItems="center"
                  style={{ color: 'var(--primary)' }}
                >
                  <UIText kind="small/regular">Other wallets</UIText>
                  <RightAngleIcon />
                </HStack>
              </HStack>
            </UnstyledButton>
          </Stack>
        </VStack>
      </VStack>
    </>
  );
}

export function PasswordFAQ() {
  const { isNarrowView } = useWindowSizeStore();

  return (
    <VStack gap={24} style={{ alignContent: 'start' }}>
      {isNarrowView ? null : (
        <div className={styles.faqIcon}>
          <img src={lockIconSrc} style={{ width: 20, height: 20 }} />
        </div>
      )}
      <VStack gap={8}>
        <UIText kind="small/regular">Why do I need a password?</UIText>
        <UIText kind="small/regular" color="var(--neutral-600)">
          This password will unlock your Zerion wallet extension when you want
          to connect to a dApp or sign a transaction.
        </UIText>
      </VStack>
    </VStack>
  );
}

export function SelectWalletsFAQ() {
  const { isNarrowView } = useWindowSizeStore();

  return (
    <VStack gap={24} style={{ alignContent: 'start' }}>
      {isNarrowView ? null : (
        <div className={styles.faqIcon}>
          <img src={dialogIconSrc} style={{ width: 20, height: 20 }} />
        </div>
      )}
      <VStack gap={8}>
        <UIText kind="small/regular">Active wallets</UIText>
        <UIText kind="small/regular" color="var(--neutral-600)">
          Wallets with a transaction history or balance on any chain supported
          by Zerion.
        </UIText>
      </VStack>
    </VStack>
  );
}
