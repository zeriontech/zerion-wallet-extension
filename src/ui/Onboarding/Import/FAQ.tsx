import React, { useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import RightAngleIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import KeyIcon from '../assets/key.png';
import DialogIcon from '../assets/dialog.png';
import LockIcon from '../assets/dialog.png';
import MetamaskIcon from '../assets/metamask.png';
import MetamaskInstruction from '../assets/metamask_instruction.png';
import WalletIcon from '../assets/wallet2.png';
import { Stack } from '../Stack';
import { useSizeStore } from '../useSizeStore';
import * as styles from './styles.module.css';
import { SidePanel } from './SidePanel';

function SecretKeyFAQ() {
  const { isNarrowView } = useSizeStore();
  const [showMetamaskPanel, setShowMetamaskPanel] = useState(false);
  const [showWalletPanel, setShowWalletPanel] = useState(false);

  return (
    <>
      <SidePanel
        show={showMetamaskPanel}
        onDismiss={() => setShowMetamaskPanel(false)}
      >
        <VStack gap={0}>
          <div className={styles.faqIcon}>
            <img src={MetamaskIcon} style={{ width: 20, height: 20 }} />
          </div>
          <Spacer height={20} />
          <UIText kind="body/accent">Where can I find my private key?</UIText>
          <Spacer height={8} />
          <UIText kind="body/regular">
            1. Open the menu from your Metamask browser extension.
          </UIText>
          <Spacer height={8} />
          <img src={MetamaskInstruction} style={{ width: 320, height: 269 }} />
          <Spacer height={16} />
          <UIText kind="body/regular">
            2. Select account details and export private key.
          </UIText>
          <Spacer height={16} />
          <UIText kind="body/regular">
            3. Enter your Metamask password and export your private key.
          </UIText>
          <Spacer height={16} />
          <UIText kind="body/regular">4. Paste in Zerion extension 🎉</UIText>
          <Spacer height={12} />
          <UIText kind="small/regular" inline={true} color="var(--neutral-600)">
            Your key information is saved locally on your device. We cannot
            store or access it.{' '}
            <TextAnchor style={{ display: 'inline' }}>
              <UIText
                kind="small/regular"
                color="var(--primary)"
                style={{ display: 'inline' }}
              >
                Find out more.
              </UIText>
            </TextAnchor>
          </UIText>
        </VStack>
      </SidePanel>
      <SidePanel
        show={showWalletPanel}
        onDismiss={() => setShowWalletPanel(false)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={WalletIcon}
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
              3. Click the Export Private Key option. You'll then have to enter
              your wallet's password.
            </UIText>
            <UIText kind="body/regular">
              4. Copy your private key and paste/ enter it in Zerion's browser
              extension.
            </UIText>
            <UIText kind="body/regular">5. That's it! You did it 🎉</UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <VStack gap={24} style={{ alignContent: 'start' }}>
        {isNarrowView ? null : (
          <div className={styles.faqIcon}>
            <img src={KeyIcon} style={{ width: 20, height: 20 }} />
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
          <Stack gap={8} direction={isNarrowView ? 'horisontal' : 'vertical'}>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setShowMetamaskPanel(true)}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={MetamaskIcon} />
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
              onClick={() => setShowWalletPanel(true)}
            >
              <HStack gap={8} alignItems="center">
                <img
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  src={WalletIcon}
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

function PhraseFAQ() {
  const { isNarrowView } = useSizeStore();
  const [showMetamaskPanel, setShowMetamaskPanel] = useState(false);
  const [showWalletPanel, setShowWalletPanel] = useState(false);

  return (
    <>
      <SidePanel
        show={showMetamaskPanel}
        onDismiss={() => setShowMetamaskPanel(false)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img src={MetamaskIcon} style={{ width: 20, height: 20 }} />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">
              Where can I find my recovery phrase?
            </UIText>
            <UIText kind="body/regular">
              1. Open the menu in your Metamask browser extension and click
              "Settings"
            </UIText>

            <UIText kind="body/regular">
              2. Then choose Security & Privacy.
            </UIText>
            <UIText kind="body/regular">
              3. Click on the Reveal Secret Recovery Phrase button and enter
              your wallet's password.
            </UIText>
            <UIText kind="body/regular">
              4. Copy your Recovery Phrase and paste it the Zerion extension.
            </UIText>
            <UIText kind="body/regular">5. Tada 🎉</UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <SidePanel
        show={showWalletPanel}
        onDismiss={() => setShowWalletPanel(false)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={WalletIcon}
              style={{ width: 20, height: 20, borderRadius: 10 }}
            />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">
              Where can I find my recovery phrase?
            </UIText>
            <UIText kind="body/regular">
              1: Open up your existing wallet, either on your mobile app or
              extension and open the Settings.
            </UIText>

            <UIText kind="body/regular">
              2: Copy your Recovery Phrase. It's usually 12 or 24 words long.
            </UIText>
            <UIText kind="body/regular">
              3: Enter in the Recovery Phrase that you copied down into the
              Zerion extension. Click on Import wallet once complete.
            </UIText>
            <UIText kind="body/regular">4: That it 🎉</UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <VStack gap={24} style={{ alignContent: 'start' }}>
        {isNarrowView ? null : (
          <div className={styles.faqIcon}>
            <img src={DialogIcon} style={{ width: 20, height: 20 }} />
          </div>
        )}
        <VStack gap={8}>
          <UIText kind="small/regular">
            Where can I find my recovery phrase?
          </UIText>
          <Stack gap={8} direction={isNarrowView ? 'horisontal' : 'vertical'}>
            <UnstyledButton
              className={styles.faqButton}
              onClick={() => setShowMetamaskPanel(true)}
            >
              <HStack gap={8} alignItems="center">
                <img style={{ width: 20, height: 20 }} src={MetamaskIcon} />
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
              onClick={() => setShowWalletPanel(true)}
            >
              <HStack gap={8} alignItems="center">
                <img
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  src={WalletIcon}
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

function PasswordFAQ() {
  const { isNarrowView } = useSizeStore();

  return (
    <VStack gap={24} style={{ alignContent: 'start' }}>
      {isNarrowView ? null : (
        <div className={styles.faqIcon}>
          <img src={LockIcon} style={{ width: 20, height: 20 }} />
        </div>
      )}
      <VStack gap={8}>
        <UIText kind="small/regular">Why do I need a password?</UIText>
        <UIText kind="small/regular" color="var(--neutral-600)">
          This password will unlock your Zerion wallet extension when you want
          to connect to a dApp or sign a transaction
        </UIText>
      </VStack>
    </VStack>
  );
}

export function FAQ({
  type,
}: {
  type: 'private-key' | 'mnemonic' | 'password';
}) {
  return type === 'private-key' ? (
    <SecretKeyFAQ />
  ) : type === 'mnemonic' ? (
    <PhraseFAQ />
  ) : (
    <PasswordFAQ />
  );
}
