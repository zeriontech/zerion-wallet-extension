import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
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
          padding: 4,
          border: '2px solid var(--white)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0px 4px 12px -4px rgba(0, 0, 0, 0.16)',
        }}
      >
        <img
          src={require('src/ui/assets/zerion-logo-round@2x.png')}
          style={{
            width: 32,
            height: 32,
          }}
        />
      </div>
      <Surface style={{ padding: 12, borderTopLeftRadius: 4 }}>{text}</Surface>
    </HStack>
  );
}

export function WithConfetti({
  children,
  confettiOriginY = 0.75,
}: React.PropsWithChildren<{
  confettiOriginY?: number;
}>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    function fire(confettiInstance: confetti.CreateTypes) {
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 150,
        startVelocity: 30,
        angle: 50,
        spread: 50,
        origin: { x: 0.6, y: confettiOriginY },
      });
      confettiInstance({
        disableForReducedMotion: true,
        particleCount: 150,
        startVelocity: 25,
        decay: 0.9,
        angle: 130,
        spread: 50,
        origin: { x: 0.6, y: confettiOriginY },
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
    }, 300);
    return () => {
      clearTimeout(timerId);
    };
  }, [confettiOriginY]);
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          width: '100%',
          height: '100%',
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
    <WithConfetti confettiOriginY={confettiOriginY}>
      <DecorativeMessage
        text={
          <UIText kind="h/6_med">
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
            <UIText kind="subtitle/m_reg">You can now use</UIText>
            <Surface
              style={{
                padding: 12,
                backgroundColor: 'var(--background)',
              }}
            >
              <HStack gap={12} alignItems="center">
                <BlockieImg address={address} size={44} />
                <div>
                  <UIText kind="subtitle/l_reg" title={address}>
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
