import React, { useLayoutEffect } from 'react';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import CheckmarkUnCheckedIcon from 'jsx:src/ui/assets/checkmark-unchecked.svg';
import { animated } from '@react-spring/web';

export function AnimatedCheckmark({
  animate = true,
  checked,
  checkedColor,
  uncheckedColor = 'var(--neutral-400)',
  tickColor,
}: {
  animate?: boolean;
  checked: boolean;
  checkedColor: string;
  uncheckedColor?: string;
  tickColor?: string;
}) {
  const { style, trigger } = useTransformTrigger({
    scale: 1.15,
    timing: 100,
  });
  useLayoutEffect(() => {
    if (!animate) {
      return;
    }
    if (checked) {
      trigger();
    }
  }, [animate, checked, trigger]);
  if (!checked) {
    return (
      <div>
        <CheckmarkUnCheckedIcon
          style={{ display: 'block', color: uncheckedColor }}
        />
      </div>
    );
  } else {
    return (
      <animated.div style={style}>
        <CheckmarkCheckedIcon
          style={Object.assign(
            { display: 'block', color: checkedColor },
            tickColor
              ? { ['--checkmark-tick-color' as string]: tickColor }
              : null
          )}
        />
      </animated.div>
    );
  }
}
