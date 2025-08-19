import React from 'react';
import cn from 'classnames';
import {
  animated,
  useChain,
  useSpring,
  useSpringRef,
  easings,
} from '@react-spring/web';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { apostrophe, emDash, NBSP } from 'src/ui/shared/typography';
import ArrowRight from 'jsx:src/ui/assets/caret-right.svg';
import SuccessIcon from 'jsx:./success.svg';
import ErrorIcon from 'jsx:./error.svg';
import type { ActionStatus } from 'src/modules/zerion-api/requests/wallet-get-actions';
import * as styles from './SuccessStateLoader.module.css';

const x_break = 0.08;
const y_break = 0.5;
function easeFunction(t: number) {
  return t < x_break
    ? t * (y_break / x_break)
    : y_break + (1 - y_break) * ((t - x_break) / (1 - x_break));
}

function AnimatedIcons({
  startItem,
  endItem,
  status,
}: {
  startItem: React.ReactNode;
  endItem: React.ReactNode;
  status: ActionStatus;
}) {
  const playExitAnimation = status === 'confirmed' || status === 'failed';

  const itemStyleRef = useSpringRef();
  const startItemStyle = useSpring({
    ref: itemStyleRef,
    from: { x: 0 },
    to: { x: playExitAnimation ? 0 : -100 },
    config: playExitAnimation
      ? { easing: easings.easeOutSine, duration: 250 }
      : { easing: easeFunction, duration: 5000 },
  });
  const endItemStyle = useSpring({
    ref: itemStyleRef,
    from: { x: 0 },
    to: { x: playExitAnimation ? 0 : 100 },
    config: playExitAnimation
      ? { easing: easings.easeOutSine, duration: 250 }
      : { easing: easeFunction, duration: 5000 },
  });
  const itemsStyleRef = useSpringRef();
  const itemsStyle = useSpring({
    ref: itemsStyleRef,
    from: { scale: 1 },
    to: { scale: 0 },
    config: { duration: 200 },
  });
  const resultIconStyleRef = useSpringRef();
  const resultIconStyle = useSpring({
    ref: resultIconStyleRef,
    from: { scale: 0 },
    to: { scale: 1 },
    config: { tension: 180, friction: 15 },
  });

  useChain(
    playExitAnimation
      ? [itemStyleRef, itemsStyleRef, resultIconStyleRef]
      : [itemStyleRef],
    playExitAnimation ? undefined : [0.3]
  );
  return (
    <div
      style={{
        position: 'relative',
        width: 72,
        height: 72,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {playExitAnimation ? null : (
        <ArrowRight
          style={{ color: 'var(--neutral-500)', position: 'relative' }}
        />
      )}
      <animated.div
        style={{
          ...itemsStyle,
          position: 'absolute',
          inset: '0 0 0 0',
          transformOrigin: 'center',
        }}
      >
        <animated.div
          style={{
            ...startItemStyle,
            position: 'absolute',
            inset: '0 0 0 0',
            zIndex: playExitAnimation ? 1 : 0,
          }}
        >
          {startItem}
        </animated.div>
        <animated.div
          style={{
            ...endItemStyle,
            position: 'absolute',
            inset: '0 0 0 0',
            zIndex: playExitAnimation ? 0 : 1,
          }}
        >
          {endItem}
        </animated.div>
      </animated.div>
      <animated.div
        style={{
          ...resultIconStyle,
          position: 'absolute',
          inset: '0 0 0 0',
          transformOrigin: 'center',
        }}
      >
        {status === 'failed' ? (
          <ErrorIcon />
        ) : status === 'confirmed' ? (
          <SuccessIcon />
        ) : null}
      </animated.div>
    </div>
  );
}

function AnimatedDots() {
  return (
    <HStack gap={2} className={styles.dots}>
      <UIText kind="headline/hero">.</UIText>
      <UIText kind="headline/hero">.</UIText>
      <UIText kind="headline/hero">.</UIText>
    </HStack>
  );
}

function BackgroundDecoration({ color }: { color: string | null }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-30vh',
        left: 0,
        right: 0,
        height: '60vh',
        transitionDuration: '1s',
        willChange: 'opacity',
        opacity: color ? 0.7 : 0,
        background: `radial-gradient(circle at top center, ${color}, transparent 65%)`,
      }}
    />
  );
}

export function SuccessStateLoader({
  startItem,
  endItem,
  status,
  pendingTitle = 'Pending',
  confirmedTitle = 'Done',
  failedTitle = 'Failed',
  dropppedTitle = 'Dropped',
  explorerUrl,
  error,
  confirmedContent,
  onDone,
}: {
  startItem: React.ReactNode;
  endItem: React.ReactNode;
  status: ActionStatus;
  pendingTitle?: string;
  confirmedTitle?: string;
  failedTitle?: string;
  dropppedTitle?: string;
  explorerUrl?: string;
  error?: string;
  confirmedContent?: React.ReactNode;
  onDone?: () => void;
}) {
  const showLongWaitNotice = useRenderDelay(5000);

  const backgroundColor =
    status === 'confirmed'
      ? 'var(--positive-500)'
      : status === 'failed' || status === 'dropped'
      ? 'var(--negative-500)'
      : null;

  return (
    <PageColumn
      style={{
        width: 'clamp(320px, 100vw, 450px)',
        marginInline: 'auto',
        position: 'relative',
      }}
      className={styles.container}
    >
      <BackgroundDecoration color={backgroundColor} />
      <VStack
        gap={0}
        style={{
          gridTemplateRows: '1fr auto auto',
          alignItems: 'center',
          flexGrow: 1,
          position: 'relative',
        }}
      >
        <VStack
          gap={32}
          style={{ justifyItems: 'center', justifySelf: 'center' }}
        >
          <AnimatedIcons
            startItem={startItem}
            endItem={endItem}
            status={status}
          />
          <VStack gap={16} style={{ justifyItems: 'center' }}>
            <VStack gap={8} style={{ justifyItems: 'center' }}>
              <UIText kind="headline/hero" style={{ position: 'relative' }}>
                {NBSP}
                <HStack
                  gap={4}
                  className={cn(
                    styles.title,
                    status !== 'pending' && styles.gone
                  )}
                >
                  <UIText kind="headline/hero">{pendingTitle}</UIText>
                  <AnimatedDots />
                </HStack>
                <UIText
                  kind="headline/hero"
                  className={cn(
                    styles.title,
                    status !== 'confirmed' && styles.hidden
                  )}
                >
                  {confirmedTitle}
                </UIText>
                <UIText
                  kind="headline/hero"
                  className={cn(
                    styles.title,
                    status !== 'failed' && styles.hidden
                  )}
                >
                  {failedTitle}
                </UIText>
                <UIText
                  kind="headline/hero"
                  className={cn(
                    styles.title,
                    status !== 'dropped' && styles.hidden
                  )}
                >
                  {dropppedTitle}
                </UIText>
              </UIText>
              {status === 'pending' && showLongWaitNotice ? (
                <UIText
                  kind="small/regular"
                  color="var(--neutral-500)"
                  style={{ textAlign: 'center' }}
                >
                  It{apostrophe}s taking longer than usual. Feel free to leave
                  {emDash}we{apostrophe}ll let you know when it{apostrophe}s
                  done.
                </UIText>
              ) : status !== 'confirmed' && error ? (
                <UIText
                  kind="small/regular"
                  color="var(--negative-500)"
                  style={{ textAlign: 'center' }}
                >
                  {error}
                </UIText>
              ) : null}
            </VStack>
            {status === 'confirmed' ? confirmedContent : null}
          </VStack>
          {explorerUrl ? (
            <UIText kind="caption/accent">
              <TextAnchor
                style={{ color: 'var(--primary)' }}
                href={explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View in Explorer
              </TextAnchor>
            </UIText>
          ) : null}
        </VStack>
        <Button kind="regular" style={{ width: '100%' }} onClick={onDone}>
          Done
        </Button>
        <Spacer height={24} />
      </VStack>
    </PageColumn>
  );
}
