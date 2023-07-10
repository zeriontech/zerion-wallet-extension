import React, { useEffect } from 'react';
import { animated } from '@react-spring/web';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import TickIcon from 'jsx:src/ui/assets/check.svg';
import type { StrengthStats } from 'src/shared/validation/password-strength';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';

export function CheckmarkBadge({
  text,
  positive,
}: {
  text: React.ReactNode;
  positive: boolean;
}) {
  const { style, trigger } = useTransformTrigger({
    timing: 80,
    scale: 1.05,
    x: 4,
    rotation: 1.05,
    springConfig: {
      tension: 250,
      friction: 15,
    },
  });
  useEffect(() => {
    if (positive) {
      trigger();
    }
  }, [positive, trigger]);
  return (
    <animated.div
      style={{
        ...style,
        display: 'flex',
        paddingBlock: 2,
        paddingInlineStart: 4,
        paddingInlineEnd: 8,
        alignItems: 'center',
        borderRadius: 6,
        gap: 4,
        backgroundColor: positive
          ? 'var(--positive-200)'
          : 'var(--neutral-200)',
        color: positive ? 'var(--positive-500)' : 'var(--neutral-500)',
      }}
    >
      <TickIcon style={{ display: 'block', width: 20, height: 20 }} />
      <span>{text}</span>
    </animated.div>
  );
}

export function StrengthChecks({ stats }: { stats: StrengthStats }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        rowGap: 6,
        whiteSpace: 'nowrap',
        flexWrap: 'wrap',
        paddingRight: 12, // make items wrap to a new line earlier (according to design)
      }}
    >
      <CheckmarkBadge
        text={`Min. ${PASSWORD_MIN_LENGTH} characters`}
        positive={stats.minLength}
      />
      <CheckmarkBadge
        text="Mix case letters"
        positive={stats.someUpperCase && stats.someLowerCase}
      />
      <CheckmarkBadge text="Numbers" positive={stats.someNumbers} />
      <CheckmarkBadge text="Symbols" positive={stats.someSymbols} />
    </div>
  );
}
