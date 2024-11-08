import confetti from 'canvas-confetti';
import React, { useCallback, useEffect, useRef } from 'react';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FillView } from 'src/ui/components/FillView';
import RewardsIcon from 'jsx:src/ui/assets/rewards.svg';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin-gradient.svg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';

export function XpDropClaimSuccess() {
  useBackgroundKind({ kind: 'white' });

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
      <PageColumn>
        <NavigationTitle title={null} documentTitle="Claim Finished" />
        <FillView>
          <VStack gap={21} style={{ justifyItems: 'center' }}>
            <CheckIcon />
            <UIText kind="headline/h1">Claim Finished!</UIText>
          </VStack>
        </FillView>
      </PageColumn>
      <PageStickyFooter>
        <Button
          kind="primary"
          as={TextAnchor}
          href="https://app.zerion.io/rewards"
          target="_blank"
          rel="noopener noreferrer"
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <RewardsIcon
              style={{
                width: 20,
                height: 20,
                color: 'linear-gradient(90deg, #A024EF 0%, #FDBB6C 100%)',
              }}
            />
            <UIText kind="body/accent">Explore Rewards</UIText>
          </HStack>
        </Button>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}
