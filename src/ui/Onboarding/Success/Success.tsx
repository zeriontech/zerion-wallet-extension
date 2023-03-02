import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ZerionIcon from 'jsx:../assets/zerion.svg';
import PinIcon from 'jsx:../assets/pin.svg';
import JigsawIcon from 'jsx:../assets/jigsaw.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import PointerIcon from '../assets/pointer.png';
import * as styles from './styles.module.css';

export function Success() {
  const pointerRef = useRef<HTMLDivElement | null>(null);
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
  useEffect(() => {
    function fire(confettiInstance: confetti.CreateTypes) {
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 100,
        startVelocity: 30,
        angle: 50,
        spread: 50,
        origin: { x: 0.8, y: 0.6 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 70,
        startVelocity: 25,
        angle: 130,
        spread: 50,
        origin: { x: 0.5, y: 0.8 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 130,
        startVelocity: 35,
        angle: 90,
        spread: 50,
        origin: { x: 0.1, y: 0.3 },
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

    const timerId = setTimeout(() => {
      fire(customConfetti);
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, []);

  return (
    <>
      <div className={styles.pinner}>
        <VStack gap={0}>
          <ZerionIcon style={{ width: 16, height: 16 }} />
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

      <div className={styles.container}>
        <VStack gap={24}>
          <div className={styles.title}>
            Welcome
            <br />
            Self-Custodial Human!
          </div>
          <UIText kind="headline/h3" color="var(--always-white)">
            Zerion's browser extension is designed
            <br />
            to make exploring web3 feel better than ever.
          </UIText>
        </VStack>
        <div className={styles.pointer} ref={pointerRef}>
          <img src={PointerIcon} width={113} height={150} />
        </div>
      </div>
    </>
  );
}
