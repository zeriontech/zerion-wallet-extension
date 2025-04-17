import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useStore } from '@store-unit/react';
import { themeStore, ThemeStore } from 'src/ui/features/appearance';
import * as s from './styles.module.css';

export function DecorativeMessage({
  text,
  isConsecutive = false,
  style,
  animate = true,
}: {
  text: React.ReactNode;
  isConsecutive?: boolean;
  style?: React.CSSProperties;
  animate?: boolean;
}) {
  const themeState = useStore(themeStore);
  return (
    <HStack
      gap={8}
      alignItems="start"
      style={{
        ...style,
        gridTemplateColumns: 'minmax(min-content, max-content) auto',
        animationFillMode: 'backwards',
      }}
      className={animate ? s.appear : undefined}
    >
      <div
        style={{
          visibility: isConsecutive ? 'hidden' : undefined,
          borderRadius: '50%',
          boxShadow: '0px 4px 12px -4px rgba(0, 0, 0, 0.16)',
        }}
      >
        <img
          src={
            ThemeStore.isDark(themeState)
              ? require('url:src/ui/assets/system-avatar-dark.svg')
              : require('url:src/ui/assets/system-avatar-light.svg')
          }
          style={{
            display: 'block',
            width: 44,
            height: 44,
          }}
        />
      </div>
      <Surface style={{ padding: 12, borderTopLeftRadius: 4 }}>{text}</Surface>
    </HStack>
  );
}

export function WithConfetti({
  children,
  fireDelay = 300,
  originY = 0.75,
  leftOriginX = 0.6,
  rightOriginX = 0.6,
  gravity = 1,
  decay = 0.9,
  particleCount = 150,
  startVelocity = 30,
  style,
}: React.PropsWithChildren<{
  fireDelay?: number;
  originY?: number;
  leftOriginX?: number;
  rightOriginX?: number;
  gravity?: number;
  decay?: number;
  particleCount?: number;
  startVelocity?: number;
  style?: React.CSSProperties;
}>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    function fire(confettiInstance: confetti.CreateTypes) {
      confettiInstance({
        disableForReducedMotion: true,
        particleCount,
        startVelocity,
        angle: 50,
        spread: 50,
        origin: { x: rightOriginX, y: originY },
        gravity,
        decay,
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount,
        startVelocity,
        angle: 130,
        spread: 50,
        origin: { x: leftOriginX, y: originY },
        gravity,
        decay,
      });
    }

    if (!canvasRef.current) {
      return;
    }

    const customConfetti = confetti.create(canvasRef.current, {
      useWorker: true,
      resize: true,
    });
    Object.assign(window, { customConfetti });

    const timerId = setTimeout(() => {
      fire(customConfetti);
    }, fireDelay);
    return () => {
      clearTimeout(timerId);
    };
  }, [
    decay,
    fireDelay,
    gravity,
    leftOriginX,
    originY,
    particleCount,
    rightOriginX,
    startVelocity,
  ]);
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          inset: 0,
          marginInline: 'auto',
          zIndex: -1,
          width: 'var(--body-width, 100%)',
          height: 'var(--body-height, 100vh)',
          ...style,
        }}
      ></canvas>
      {children}
    </>
  );
}

export function DecorativeMessageDone({
  address,
  messageKind = 'new',
  confettiOriginY = 0.75,
}: {
  address: string;
  messageKind?: 'import' | 'new';
  confettiOriginY?: number;
}) {
  return (
    <WithConfetti originY={confettiOriginY}>
      <DecorativeMessage
        text={
          <UIText kind="headline/h3">
            All done!{' '}
            <span style={{ color: 'var(--primary)' }}>
              {messageKind === 'import'
                ? 'Your wallet has been imported 🚀'
                : 'Your wallet has been created 🚀'}
            </span>
          </UIText>
        }
      />
      <DecorativeMessage
        isConsecutive={true}
        style={{ animationDelay: '300ms' }}
        text={
          <VStack gap={8}>
            <UIText kind="small/regular">You can now use</UIText>
            <Surface
              style={{
                padding: 12,
                backgroundColor: 'var(--z-index-1)',
              }}
            >
              <HStack gap={12} alignItems="center">
                <WalletAvatar address={address} size={44} borderRadius={4} />
                <div>
                  <UIText kind="body/regular" title={address}>
                    {truncateAddress(address, 8)}
                  </UIText>
                </div>
              </HStack>
            </Surface>
          </VStack>
        }
      />
    </WithConfetti>
  );
}
