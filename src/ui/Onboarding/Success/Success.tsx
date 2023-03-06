import React, { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ZerionIcon from 'jsx:../assets/zerion.svg';
import PinIcon from 'jsx:../assets/pin.svg';
import JigsawIcon from 'jsx:../assets/jigsaw.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import PointerIcon from '../assets/pointer.png';
import { useSizeStore } from '../useSizeStore';
import * as styles from './styles.module.css';

export function Success() {
  const { isNarrowView } = useSizeStore();
  const pointerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (pointerRef.current) {
        const xShift = (-10 * event.pageX) / window.innerWidth;
        const yShift = (-10 * event.pageY) / window.innerHeight;
        pointerRef.current.style.setProperty(
          'transform',
          `translate(${xShift}px, ${yShift}px)`
        );
      }
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const fireConfetti = useCallback(() => {
    function fire(confettiInstance: confetti.CreateTypes) {
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 100,
        startVelocity: 30,
        angle: 180 - Math.random() * 90,
        spread: 50,
        origin: { x: 0.7 + Math.random() * 0.2, y: 0.5 + Math.random() * 0.2 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 70,
        startVelocity: 25,
        angle: Math.random() * 180,
        spread: 50,
        origin: { x: 0.4 + Math.random() * 0.2, y: 0.7 + Math.random() * 0.2 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 130,
        startVelocity: 35,
        angle: 90 + Math.random() * 90,
        spread: 50,
        origin: { x: Math.random() * 0.2, y: 0.2 + Math.random() * 0.2 },
        gravity: 1,
        decay: 0.9,
      });
    }

    if (!confettiRef.current) {
      return;
    }

    const customConfetti = confetti.create(confettiRef.current, {
      useWorker: true,
      resize: true,
    });
    Object.assign(window, { customConfetti });

    fire(customConfetti);
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fireConfetti();
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [fireConfetti]);

  return (
    <>
      <canvas
        ref={confettiRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      ></canvas>
      <VStack gap={24}>
        <div className={styles.container}>
          <VStack gap={24}>
            <div className={styles.title}>
              Welcome
              <br />
              Self-Custodial Human!
            </div>
            <UIText kind="headline/h3" color="var(--always-white)">
              Zerion's browser extension is designed
              {isNarrowView ? ' ' : <br />}
              to make exploring web3 feel better than ever.
            </UIText>
          </VStack>
          {isNarrowView ? null : (
            <UnstyledButton
              className={styles.pointer}
              ref={pointerRef}
              onClick={fireConfetti}
            >
              <img src={PointerIcon} width={113} height={150} />
            </UnstyledButton>
          )}
        </div>
        <div className={styles.pinner}>
          <VStack gap={0}>
            <ZerionIcon
              style={{ width: 16, height: 16, color: 'var(--black)' }}
            />
            <Spacer height={16} />
            <UIText kind="headline/h3">Pin Zerion extension</UIText>
            <Spacer height={24} />
            <UIText kind="body/regular">
              Click
              <JigsawIcon
                style={{
                  display: 'inline',
                  height: 17,
                  width: 17,
                  margin: '0 8px',
                }}
              />
              in your browser
              <br />
              and click the
              <PinIcon
                style={{
                  display: 'inline',
                  height: 17,
                  width: 12,
                  margin: '0 8px',
                }}
              />
              button
            </UIText>
          </VStack>
        </div>
      </VStack>
    </>
  );
}
