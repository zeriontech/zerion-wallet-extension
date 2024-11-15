import React from 'react';
import type {
  SpringConfig,
  TransitionFrom,
  TransitionTo,
} from '@react-spring/web';
import { animated, useTransition } from '@react-spring/web';

export function AnimatedAppear({
  display,
  children,
  from = { opacity: 0, y: 30 },
  enter = { opacity: 1, y: 0 },
  leave = { opacity: 0, y: 30 },
  config = { tension: 400 },
}: React.PropsWithChildren<{
  display: boolean;
  from?: TransitionFrom<number>;
  enter?: TransitionTo<number>;
  leave?: TransitionTo<number>;
  config?: SpringConfig;
}>) {
  const data = display ? [1] : [];
  const transitions = useTransition(data, {
    config,
    from,
    enter,
    leave,
  });
  return transitions((style) => (
    <animated.div style={style}>{children}</animated.div>
  ));
}
