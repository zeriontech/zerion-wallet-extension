import React, { useCallback, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import cn from 'classnames';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import * as helperStyles from 'src/ui/features/onboarding/shared/helperStyles.module.css';
import { urlContext } from 'src/shared/UrlContext';
import { apostrophe } from 'src/ui/shared/typography';
import CardImg1 from './create_card_1.png';
import CardImg2 from './create_card_2.png';
import CardImg3 from './create_card_3.png';
import * as styles from './styles.module.css';

const MAX_CARD_INDEX = 2;

function Card({
  index,
  activeIndex,
  image,
  text,
}: {
  index: number;
  activeIndex: number;
  image: React.ReactNode;
  text: string;
}) {
  const position = index - activeIndex;

  const style = useSpring({
    transform:
      position < 0
        ? `rotate(0deg)
         scale(1.1)`
        : position === 0
        ? `rotate(0deg)
         scale(1)`
        : position === 1
        ? `rotate(7deg)
         scale(0.85)`
        : `rotate(14deg)
         scale(0.7)`,
    config: {
      tension: 200,
      friction: 17,
    },
  } as const);

  return (
    <animated.div
      style={{
        ...style,
        position: 'absolute',
        transition: 'opacity 300ms ease-in-out, filter 300ms ease-in-out',
        opacity:
          position < 0 ? 0 : position === 0 ? 1 : position === 1 ? 0.4 : 0.2,
        pointerEvents: position < 0 ? 'none' : undefined,
        transformOrigin: position < 0 ? '50% 50%' : '100% 100%',
        filter: position < 0 ? 'blur(5px)' : undefined,
        zIndex: 2 - position,
      }}
    >
      <VStack gap={24} className={styles.card}>
        {image}
        <UIText kind="body/accent" style={{ paddingInline: 24 }}>
          {text}
        </UIText>
      </VStack>
    </animated.div>
  );
}

function ExitCreateWalletFlowDialog() {
  return (
    <form
      method="dialog"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <VStack gap={24}>
        <UIText kind="headline/h3">Interrupt the Process</UIText>
        <UIText kind="small/accent">
          If you interrupt the process you will lose the
          <br />
          current progress of wallet creation.
        </UIText>

        <HStack
          gap={12}
          justifyContent="center"
          style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
        >
          <Button value="cancel" kind="regular">
            Cancel
          </Button>
          <Button value="confirm" style={{ paddingInline: 16 }}>
            Interrupt
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}

function InfoHeadline() {
  return (
    <UIText kind="headline/h2">
      {urlContext.appMode === 'onboarding' ? (
        <>
          Wallet is Ready.
          <br />
          Let’s Back Up Your Wallet!
        </>
      ) : (
        'Let’s Back Up Your Wallet!'
      )}
    </UIText>
  );
}

export function Info({
  onStart,
  onSkip,
  onExit,
}: {
  onStart: () => void;
  onSkip?: () => void;
  onExit?: () => void;
}) {
  const { isNarrowView } = useWindowSizeStore();
  const [activeCard, setActiveCard] = useState(0);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleClick = useCallback(() => {
    if (activeCard < MAX_CARD_INDEX) {
      setActiveCard(activeCard + 1);
    } else {
      onStart();
    }
  }, [activeCard, onStart]);

  return (
    <>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ padding: '20px 24px' }}
        style={{ width: 340, height: 196 }}
      >
        <ExitCreateWalletFlowDialog />
      </CenteredDialog>
      <VStack gap={isNarrowView ? 16 : 56}>
        <div
          className={cn(helperStyles.container, helperStyles.appear)}
          style={{ justifyContent: 'center', paddingBottom: 48 }}
        >
          {onExit ? (
            <UnstyledButton
              aria-label="Exit creating wallet"
              className={helperStyles.backButton}
              onClick={() => {
                if (!dialogRef.current) {
                  return;
                }
                showConfirmDialog(dialogRef.current).then(onExit);
              }}
            >
              <CloseIcon style={{ width: 20, height: 20 }} />
            </UnstyledButton>
          ) : null}
          <VStack gap={40}>
            <InfoHeadline />
            <VStack gap={32} style={{ justifyItems: 'center' }}>
              <div style={{ height: 288, width: 338 }}>
                <Card
                  index={0}
                  activeIndex={activeCard}
                  image={
                    <img
                      src={CardImg1}
                      alt="Write down seed phrase"
                      className={styles.cardImg}
                    />
                  }
                  text={`For security, it${apostrophe}s crucial to write down the recovery phrase and store it securely.`}
                />
                <Card
                  index={1}
                  activeIndex={activeCard}
                  image={
                    <img
                      src={CardImg2}
                      alt="Seed phrase is the only way to restore assets"
                      className={styles.cardImg}
                    />
                  }
                  text="Your recovery phrase is the only way to access your accounts and assets, even if you forget your passcode."
                />
                <Card
                  index={2}
                  activeIndex={activeCard}
                  image={
                    <img
                      src={CardImg3}
                      alt="Never share seed phrase"
                      className={styles.cardImg}
                    />
                  }
                  text="Never share your recovery phrase or passcode with anyone, including Zerion team members."
                />
              </div>
              <VStack gap={12} style={{ justifyContent: 'center' }}>
                <Button onClick={handleClick} autoFocus={true}>
                  {activeCard === MAX_CARD_INDEX ? 'Back up now' : 'Continue'}
                </Button>
                {onSkip && activeCard === MAX_CARD_INDEX ? (
                  <Button kind="ghost" onClick={onSkip}>
                    Do it Later
                  </Button>
                ) : (
                  <div style={{ height: 44 }} />
                )}
              </VStack>
            </VStack>
          </VStack>
        </div>
        <PrivacyFooter />
      </VStack>
    </>
  );
}
