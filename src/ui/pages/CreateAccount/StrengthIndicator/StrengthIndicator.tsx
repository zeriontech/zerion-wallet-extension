import React, { useEffect } from 'react';
import { animated } from '@react-spring/web';
import {
  estimatePasswordStrengh,
  Strength,
} from 'src/shared/validation/password-strength';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';

function Rect({
  style,
  fill,
}: {
  style: ReturnType<typeof useTransformTrigger>['style'];
  fill: string;
}) {
  return (
    <animated.svg style={{ ...style, width: 8, height: 4 }} viewBox="0 0 8 4">
      <rect width="8" height="4" rx="1" fill={fill} />
    </animated.svg>
  );
}

function Indicator({ value, weakest }: { value: Strength; weakest: boolean }) {
  const config = {
    scale: 1.2,
    timing: 80,
  };
  const delay = 70;
  const { style: style1, trigger: trigger1 } = useTransformTrigger({
    ...config,
    delay: 0 * delay,
  });
  const { style: style2, trigger: trigger2 } = useTransformTrigger({
    ...config,
    delay: 1 * delay,
  });
  const { style: style3, trigger: trigger3 } = useTransformTrigger({
    ...config,
    delay: 2 * delay,
  });
  const { style: style4, trigger: trigger4 } = useTransformTrigger({
    ...config,
    delay: 3 * delay,
  });
  const colors = {
    [Strength.weak]: 'var(--neutral-500)',
    [Strength.medium]: 'var(--notice-500)',
    [Strength.strong]: 'var(--positive-500)',
  };
  useEffect(() => {
    if (value === Strength.strong) {
      trigger1();
      trigger2();
      trigger3();
      trigger4();
    } else if (value === Strength.medium) {
      trigger1();
      trigger2();
    }
  }, [value, trigger1, trigger2, trigger3, trigger4]);

  return (
    <div
      style={{ display: 'grid', gap: 2, gridTemplateRows: '4px 4px 4px 4px' }}
    >
      <Rect
        style={style4}
        // top two bars: color only when Strength.strong
        fill={value === Strength.strong ? colors[value] : colors[Strength.weak]}
      />
      <Rect
        style={style3}
        // top two bars: color only when Strength.strong
        fill={value === Strength.strong ? colors[value] : colors[Strength.weak]}
      />
      <Rect style={style2} fill={colors[value]} />
      <Rect
        style={style1}
        // lowest bar: color as medium for any non-empty input
        fill={
          value === Strength.weak && weakest
            ? colors[Strength.medium]
            : colors[value]
        }
      />
    </div>
  );
}

export function StrengthIndicator({ value }: { value: string }) {
  const strength = estimatePasswordStrengh(value);
  return <Indicator value={strength} weakest={value.length > 0} />;
}
