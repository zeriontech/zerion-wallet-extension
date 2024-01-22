import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animated, useSpring } from '@react-spring/web';
import confetti from 'canvas-confetti';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { invariant } from 'src/shared/invariant';
import { useAddressNftPosition } from 'defi-sdk';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import CloseTabIcon from 'jsx:src/ui/DNA/assets/close-tab.svg';
import TabLine from 'jsx:src/ui/DNA/assets/tab.svg';
import * as helpersStyles from '../../shared/styles.module.css';
import { Step } from '../../shared/Step';
import { DNA_NFT_COLLECTION_ADDRESS } from '../../shared/constants';
import { useAddressHasDnaUpgradeBackgroundPerk } from '../../shared/useShowDnaBanner';

export function Success() {
  const [params] = useSearchParams();
  const address = params.get('address');
  const tokenId = params.get('token-id');
  invariant(address, 'address should exist in search params');
  invariant(tokenId, 'token id should exist in search params');

  const { value } = useAddressNftPosition(
    {
      address,
      chain: NetworkId.Ethereum,
      contract_address: DNA_NFT_COLLECTION_ADDRESS,
      token_id: tokenId,
      currency: 'usd',
    },
    { cachePolicy: 'network-only' }
  );

  const [ready, setReady] = useState(false);

  const style = useSpring({
    transform: ready ? 'scale(1)' : 'scale(0.8)',
    config: {
      tension: 300,
      friction: 10,
    },
  });

  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const fireConfetti = useCallback(() => {
    function fire(confettiInstance: confetti.CreateTypes) {
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 100,
        startVelocity: 30,
        angle: 130,
        spread: 50,
        origin: { x: 0.9, y: 0.5 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 70,
        startVelocity: 25,
        angle: 90,
        spread: 50,
        origin: { x: 0.4, y: 0.9 },
        gravity: 1,
        decay: 0.9,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 130,
        startVelocity: 35,
        angle: 70,
        spread: 50,
        origin: { x: 0.1, y: 0.4 },
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
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (ready) {
      timerId = setTimeout(() => {
        fireConfetti();
      }, 500);
    }
    return () => {
      clearTimeout(timerId);
    };
  }, [ready, fireConfetti]);

  const contentAppearStyle = useSpring({
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: {
      tension: 80,
      friction: 30,
    },
  });

  const showContinueButton = useAddressHasDnaUpgradeBackgroundPerk(address);

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
      <div className={helpersStyles.container} style={{ height: 600 }}>
        <VStack gap={32} style={{ justifyItems: 'center' }}>
          <animated.div style={contentAppearStyle}>
            <UIText kind="headline/hero">Say hello to your DNA</UIText>
          </animated.div>
          {!value ? (
            <div
              style={{
                width: 312,
                height: 312,
              }}
            />
          ) : (
            <animated.div style={style}>
              <MediaContent
                content={value.metadata.content}
                alt={`${value.metadata.name} content`}
                className={ready ? helpersStyles.dnaPreview : undefined}
                onReady={() => setTimeout(() => setReady(true), 100)}
                style={{
                  display: 'block',
                  maxHeight: 312,
                  minHeight: 312,
                  objectFit: 'cover',
                  boxShadow: ready
                    ? '0px 7.02px 14.04px 0px rgba(0, 0, 0, 0.12)'
                    : undefined,
                  opacity: ready ? 1 : 0.01,
                  borderRadius: 28,
                }}
                errorStyle={{
                  width: 312,
                  height: 312,
                }}
              />
            </animated.div>
          )}
          {showContinueButton ? (
            <Button
              kind="primary"
              size={48}
              style={{ paddingInline: 16 }}
              as={UnstyledLink}
              to={`/upgrade-dna?steps=true&address=${address}`}
            >
              Continue
            </Button>
          ) : (
            <VStack gap={0} style={{ justifyItems: 'center' }}>
              <UIText kind="small/accent" color="var(--neutral-600)">
                Zerion is the safest and easiest way to explore web3.
              </UIText>
              <HStack gap={13} alignItems="center">
                <UIText kind="small/accent" color="var(--neutral-600)">
                  You can
                </UIText>
                <HStack
                  gap={8}
                  alignItems="center"
                  style={{ position: 'relative' }}
                >
                  <UIText kind="small/accent">close this tab</UIText>
                  <CloseTabIcon
                    style={{
                      width: 14,
                      height: 14,
                      position: 'relative',
                      top: 1,
                    }}
                  />
                  <TabLine
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: -21,
                    }}
                  />
                </HStack>
                <UIText kind="small/accent" color="var(--neutral-600)">
                  to get started!
                </UIText>
              </HStack>
            </VStack>
          )}
        </VStack>
        <HStack gap={4} className={helpersStyles.steps} justifyContent="center">
          <Step active={false} />
          <Step active={true} />
          <Step active={false} />
          <Step active={false} />
        </HStack>
      </div>
    </>
  );
}
