import React, { useLayoutEffect } from 'react';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import CheckmarkUnCheckedIcon from 'jsx:src/ui/assets/checkmark-unchecked.svg';
import { animated } from 'react-spring';

export function AnimatedCheckmark({
  animate = true,
  checked,
  checkedColor,
}: {
  animate?: boolean;
  checked: boolean;
  checkedColor: string;
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
        <CheckmarkUnCheckedIcon style={{ display: 'block' }} />
      </div>
    );
  } else {
    return (
      <animated.div style={style}>
        <CheckmarkCheckedIcon
          style={{ display: 'block', color: checkedColor }}
        />
      </animated.div>
    );
  }
}
