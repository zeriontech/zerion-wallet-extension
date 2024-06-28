import React, { useCallback, useEffect, useRef } from 'react';
import cn from 'classnames';
import confetti from 'canvas-confetti';
import { useSpring, animated } from '@react-spring/web';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ZerionIcon from 'jsx:./assets/zerion.svg';
import PinIcon from 'jsx:./assets/pin.svg';
import JigsawIcon from 'jsx:./assets/jigsaw.svg';
import coinImgSrc from 'src/ui/assets/zer_coin.png';
import sparkImgSrc from 'src/ui/assets/zer_spark.png';
import starImgSrc from 'src/ui/assets/zer_star.png';
import * as styles from './styles.module.css';

export function Success() {
  const { isNarrowView } = useWindowSizeStore();
  const coinRef = useRef<HTMLButtonElement | null>(null);
  const starRef = useRef<HTMLButtonElement | null>(null);
  const sparkRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const xShift = (-10 * event.pageX) / window.innerWidth;
      const yShift = (-10 * event.pageY) / window.innerHeight;
      const newTransformProperty = `translate(${xShift}px, ${yShift}px)`;
      coinRef.current?.style.setProperty('transform', newTransformProperty);
      starRef.current?.style.setProperty('transform', newTransformProperty);
      sparkRef.current?.style.setProperty('transform', newTransformProperty);
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

  const pinnerStyle = useSpring({
    config: { mass: 1, tension: 150, friction: 8 },
    delay: 1000,
    from: {
      opacity: 0,
      x: 30,
    },
    to: {
      opacity: 1,
      x: 0,
    },
  });

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
              Nicely Done
              <br />
              Self-Custodial Human!
            </div>
            <UIText kind="headline/h3" color="var(--always-white)">
              Zerion makes exploring web3 feel better than ever.
              {isNarrowView ? ' ' : <br />}
              You can close this tab to get started.
            </UIText>
          </VStack>
          {isNarrowView ? null : (
            <>
              <UnstyledButton
                className={cn(styles.decoration, styles.coinDecoration)}
                ref={coinRef}
                onClick={fireConfetti}
              >
                <img src={coinImgSrc} width={120} height={120} />
              </UnstyledButton>
              <UnstyledButton
                className={cn(styles.decoration, styles.starDecoration)}
                ref={starRef}
                onClick={fireConfetti}
              >
                <img src={starImgSrc} width={80} height={80} />
              </UnstyledButton>
              <UnstyledButton
                className={cn(styles.decoration, styles.sparkDecoration)}
                ref={sparkRef}
                onClick={fireConfetti}
              >
                <img src={sparkImgSrc} width={60} height={60} />
              </UnstyledButton>
            </>
          )}
        </div>
        <animated.div className={styles.pinner} style={pinnerStyle}>
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
        </animated.div>
      </VStack>
    </>
  );
}
