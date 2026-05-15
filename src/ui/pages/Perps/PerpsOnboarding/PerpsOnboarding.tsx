import React, { useEffect, useState } from 'react';
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
  imageSrc: string;
  imageSrcSet: string;
  alt: string;
}

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ opacity: 0, x: 64 * dir, filter: 'blur(3px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: -64 * dir, filter: 'blur(3px)' }),
};

const SLIDES: Slide[] = [
  {
    title: 'Perpetual Futures',
    body: 'Trade on whether you expect the price to move up or down, with no expiration date.',
    imageSrc: 'https://cdn.zerion.io/images/dna-assets/perps_onboarding_1.png',
    imageSrcSet:
      'https://cdn.zerion.io/images/dna-assets/perps_onboarding_1.png 1x, https://cdn.zerion.io/images/dna-assets/perps_onboarding_1_2x.png 2x',
    alt: 'Perpetual futures illustration',
  },
  {
    title: 'Go Long or Short',
    body: 'Go long if you expect the price to rise, or short if you expect it to fall.',
    imageSrc: 'https://cdn.zerion.io/images/dna-assets/perps_onboarding_2.png',
    imageSrcSet:
      'https://cdn.zerion.io/images/dna-assets/perps_onboarding_2.png 1x, https://cdn.zerion.io/images/dna-assets/perps_onboarding_2_2x.png 2x',
    alt: 'Long or short illustration',
  },
  {
    title: 'Trade with Leverage',
    body: 'Leverage amplifies gains and losses. If the price hits your liquidation level, your position closes.',
    imageSrc: 'https://cdn.zerion.io/images/dna-assets/perps_onboarding_3.png',
    imageSrcSet:
      'https://cdn.zerion.io/images/dna-assets/perps_onboarding_3.png 1x, https://cdn.zerion.io/images/dna-assets/perps_onboarding_3_2.png 2x',
    alt: 'Leverage illustration',
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
  const [direction, setDirection] = useState(1);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const buttonLabel = isLast ? 'Got it' : 'Next';

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setDirection(1);
    }
  }, [open]);

  function goTo(next: number) {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function handleNext() {
    if (isLast) {
      onDismiss();
    } else {
      goTo(index + 1);
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
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 },
                opacity: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                filter: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
              }}
              className={s.slide}
            >
              <img
                src={slide.imageSrc}
                srcSet={slide.imageSrcSet}
                alt={slide.alt}
                width={220}
                height={220}
                className={s.illustration}
              />
              <VStack gap={12} style={{ textAlign: 'center' }}>
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
              <UnstyledButton
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`${s.dot} ${i === index ? s.dotActive : ''}`}
              />
            ))}
          </HStack>
          <Button kind="primary" size={48} onClick={handleNext}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={buttonLabel}
                style={{ display: 'inline-block' }}
                transition={{ duration: 0.15 }}
                initial={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              >
                {buttonLabel}
              </motion.span>
            </AnimatePresence>
          </Button>
        </VStack>
      </div>
    </Dialog2>
  );
}
