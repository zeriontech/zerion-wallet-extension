import React from 'react';
import type { TransitionFrom, TransitionTo } from '@react-spring/web';
import { animated, useTransition } from '@react-spring/web';

export function AnimatedAppear({
  display,
  children,
  from = { opacity: 0, y: 30 },
  enter = { opacity: 1, y: 0 },
  leave = { opacity: 0, y: 30 },
}: React.PropsWithChildren<{
  display: boolean;
  from?: TransitionFrom<number>;
  enter?: TransitionTo<number>;
  leave?: TransitionTo<number>;
}>) {
  const data = display ? [1] : [];
  const transitions = useTransition(data, {
    config: { tension: 400 },
    from,
    enter,
    leave,
  });
  return transitions((style) => (
    <animated.div style={style}>{children}</animated.div>
  ));
}
