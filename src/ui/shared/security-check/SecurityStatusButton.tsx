import React, { useEffect, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { createNanoEvents } from 'nanoevents';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import ShieldWarningIcon from 'jsx:src/ui/assets/shield-warning.svg';
import WarningIcon from 'jsx:src/ui/assets/warning-triangle.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import * as styles from './styles.module.css';

export type SecurityButtonKind =
  | 'ok'
  | 'danger'
  | 'warning'
  | 'unknown'
  | 'loading';

const SECURITY_COLORS: Record<
  SecurityButtonKind,
  { primary: string; secondary: string; accent?: string }
> = {
  warning: {
    primary: 'var(--notice-500)',
    secondary: 'var(--notice-100)',
    accent: 'var(--notice-500)',
  },
  loading: {
    primary: 'var(--neutral-600)',
    secondary: 'var(--neutral-100)',
    accent: 'var(--black)',
  },
  unknown: {
    primary: 'var(--neutral-600)',
    secondary: 'var(--neutral-100)',
    accent: 'var(--primary)',
  },
  danger: {
    primary: 'var(--negative-500)',
    secondary: 'var(--negative-200)',
    accent: 'var(--negative-500)',
  },
  ok: {
    primary: 'var(--positive-500)',
    secondary: 'var(--positive-100)',
    accent: 'var(--positive-500)',
  },
};

function SecurityCheckIcon({
  kind,
  iconSize,
}: {
  kind: SecurityButtonKind;
  iconSize: number;
}) {
  if (kind === 'loading') {
    return (
      <div
        style={{
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className={styles.loadingShield}
          style={{ width: iconSize, height: iconSize }}
        >
          <div />
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        width: iconSize,
        height: iconSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'ok' ? (
        <ShieldIcon style={{ color: SECURITY_COLORS[kind].accent }} />
      ) : kind === 'unknown' ? (
        <WarningIcon style={{ color: SECURITY_COLORS[kind].accent }} />
      ) : (
        <ShieldWarningIcon style={{ color: SECURITY_COLORS[kind].accent }} />
      )}
    </div>
  );
}

const emitter = createNanoEvents<{
  securityStatusChange: (kind: SecurityButtonKind) => void;
}>();

export function SecurityStatusBackground() {
  const [kind, setKind] = useState<SecurityButtonKind | undefined>(undefined);
  const render = useRenderDelay(100);

  useEffect(() => {
    return emitter.on('securityStatusChange', (newKind) => {
      setKind(newKind);
    });
  }, []);

  return kind && render ? (
    <div className={styles.backgroundGradientContainer}>
      <div
        className={styles.backgroundGradient}
        style={{
          ['--security-gradient-background-color' as string]:
            SECURITY_COLORS[kind].accent,
        }}
      />
    </div>
  ) : null;
}

export function SecurityStatusButton({
  kind,
  title,
  onClick,
  size,
}: {
  kind: SecurityButtonKind;
  title: React.ReactNode;
  onClick?: () => void;
  size: 'small' | 'big';
}) {
  const isLoading = kind === 'loading';

  const style = useSpring({
    from: { transform: 'scale(1)' },
    to: { transform: isLoading ? 'scale(0.8)' : 'scale(1)' },
    config: {
      duration: isLoading ? 5000 : undefined,
      tension: isLoading ? 100 : 200,
      friction: isLoading ? 50 : 10,
    },
  });

  useEffect(() => {
    if (kind !== 'loading') {
      emitter.emit('securityStatusChange', kind);
    }
  }, [kind]);

  return (
    <>
      <animated.div style={style}>
        <UnstyledButton
          type="button"
          style={{
            width: '100%',
            height: size === 'big' ? 52 : 44,
            whiteSpace: 'nowrap',
          }}
          disabled={!onClick}
          onClick={onClick}
        >
          <HStack
            gap={0}
            justifyContent={size === 'big' ? 'space-between' : 'center'}
            alignItems="center"
            style={{
              backgroundColor: SECURITY_COLORS[kind].secondary,
              padding: '8px 12px',
              borderRadius: 100,
            }}
          >
            <HStack gap={size === 'big' ? 12 : 0} alignItems="center">
              <SecurityCheckIcon
                kind={kind}
                iconSize={size === 'big' ? 32 : 28}
              />
              <UIText
                kind={size === 'big' ? 'body/accent' : 'small/accent'}
                color={SECURITY_COLORS[kind].primary}
                style={{ textAlign: 'start' }}
              >
                {title}
              </UIText>
            </HStack>
            {onClick ? (
              <ArrowDownIcon
                style={{
                  width: 24,
                  height: 24,
                  color: SECURITY_COLORS[kind].primary,
                }}
              />
            ) : null}
          </HStack>
        </UnstyledButton>
      </animated.div>
    </>
  );
}
