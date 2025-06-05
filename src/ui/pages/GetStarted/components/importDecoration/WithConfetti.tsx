import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

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
