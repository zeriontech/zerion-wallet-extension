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
import { useMutation, useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';

const ZERION_ORIGIN = 'https://app.zerion.io';

export function XpDropClaimSuccess() {
  useBackgroundKind({ kind: 'white' });

  const { pathname } = useLocation();

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

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  useEffect(() => {
    const timerId = setTimeout(() => {
      fireConfetti();
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [fireConfetti]);

  const { mutate: acceptZerionOrigin } = useMutation({
    mutationFn: async () => {
      invariant(currentWallet, 'Current wallet not found');
      return walletPort.request('acceptOrigin', {
        origin: ZERION_ORIGIN,
        address: currentWallet.address,
      });
    },
  });

  const addWalletParams = useWalletParams(currentWallet);

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
        <NavigationTitle
          title={null}
          documentTitle="Claim Finished"
          backTo="/overview"
        />
        <FillView>
          <VStack gap={21} style={{ justifyItems: 'center' }}>
            <CheckIcon />
            <UIText kind="headline/h1">Claim Finished!</UIText>
          </VStack>
        </FillView>
      </PageColumn>
      {currentWallet ? (
        <PageStickyFooter>
          <Button
            as={TextAnchor}
            kind="primary"
            href={`${ZERION_ORIGIN}/rewards?${addWalletParams}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              emitter.emit('buttonClicked', {
                buttonScope: 'Loaylty',
                buttonName: 'Rewards',
                pathname,
              });
              acceptZerionOrigin();
            }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <RewardsIcon
                style={{
                  width: 20,
                  height: 20,
                  color: 'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)',
                }}
              />
              <UIText kind="body/accent">Explore Rewards</UIText>
            </HStack>
          </Button>
          <PageBottom />
        </PageStickyFooter>
      ) : null}
    </>
  );
}
