import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import * as s from './styles.module.css';

interface Slide {
  title: string;
  body: string;
  emoji: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '📈',
    title: 'Trade perpetual futures',
    body: 'Perpetuals (perps) let you go long or short on an asset with leverage. Unlike spot, you never take delivery — your P&L settles in USDC.',
  },
  {
    emoji: '⚡️',
    title: 'Leverage amplifies both sides',
    body: 'Leverage multiplies gains and losses against your collateral. Pick a level you can stomach: smaller leverage gives you more room before liquidation.',
  },
  {
    emoji: '⚠️',
    title: 'Watch the liquidation price',
    body: 'If price moves against your position past the liquidation threshold, your margin is wiped and the position closes. The trade form shows this price live before you confirm.',
  },
];

export function PerpsOnboarding({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  function handleNext() {
    if (isLast) {
      onDismiss();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <Dialog2 open={open} onClose={onDismiss} size="full" autoFocusInput={false}>
      <div className={s.root}>
        <div className={s.topRow}>
          <UnstyledButton
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss onboarding"
            className={s.closeButton}
          >
            <CloseIcon style={{ width: 20, height: 20 }} />
          </UnstyledButton>
        </div>

        <div className={s.slideArea}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className={s.slide}
            >
              <div className={s.emoji} aria-hidden="true">
                {slide.emoji}
              </div>
              <VStack gap={12}>
                <UIText kind="headline/h2">{slide.title}</UIText>
                <UIText kind="body/regular" color="var(--neutral-700)">
                  {slide.body}
                </UIText>
              </VStack>
            </motion.div>
          </AnimatePresence>
        </div>

        <VStack gap={20} className={s.footer}>
          <HStack gap={8} justifyContent="center">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`${s.dot} ${i === index ? s.dotActive : ''}`}
                aria-hidden="true"
              />
            ))}
          </HStack>
          <Button kind="primary" size={48} onClick={handleNext}>
            {isLast ? 'Got it' : 'Next'}
          </Button>
        </VStack>
      </div>
    </Dialog2>
  );
}
