import React, { useEffect } from 'react';
import { animated } from '@react-spring/web';
import type { StrengthStats } from 'src/shared/validation/password-strength';
import { Strength } from 'src/shared/validation/password-strength';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';

function Rect({
  animatedStyle,
  style,
  trackStyle,
  color,
}: {
  animatedStyle?: ReturnType<typeof useTransformTrigger>['style'];
  style?: React.CSSProperties;
  trackStyle?: React.CSSProperties;
  color: string;
}) {
  return (
    <animated.div
      style={{
        ...animatedStyle,
        ...style,
        backgroundColor: 'var(--neutral-100)',
        height: 4,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <animated.div
        style={{
          ...trackStyle,
          backgroundColor: color,
          transition: 'background-color 150ms',
          width: '100%',
          height: '100%',
        }}
      />
    </animated.div>
  );
}

function Indicator({ value, weakest }: { value: Strength; weakest: boolean }) {
  const colors = {
    weakest: 'var(--negative-400)',
    empty: 'var(--neutral-100)',
    [Strength.medium]: 'var(--notice-500)',
    [Strength.strong]: 'var(--positive-500)',
  };
  const { style: scaleXStyle, trigger: triggerScaleX } = useTransformTrigger({
    timing: 80,
    scaleX: 1.1,
    springConfig: {
      tension: 250,
      friction: 8,
    },
  });
  useEffect(() => {
    if (value === Strength.strong) {
      triggerScaleX();
    }
  }, [value, triggerScaleX]);
  const atLeastMedium = value === Strength.medium || value === Strength.strong;

  return (
    <div
      style={{ display: 'grid', gap: 4, gridTemplateColumns: '1fr 1fr 1fr' }}
    >
      <Rect
        color={
          value === Strength.medium || value === Strength.strong
            ? colors[value]
            : weakest
            ? colors.weakest
            : colors.empty
        }
      />
      <Rect color={atLeastMedium ? colors[value] : colors.empty} />
      <Rect
        animatedStyle={{ ...scaleXStyle }}
        style={{ transformOrigin: 'left' }}
        color={value === Strength.strong ? colors[value] : colors.empty}
      />
    </div>
  );
}

export function StrengthIndicator({ stats }: { stats: StrengthStats }) {
  const { strength, length } = stats;
  return <Indicator value={strength} weakest={length >= PASSWORD_MIN_LENGTH} />;
}
