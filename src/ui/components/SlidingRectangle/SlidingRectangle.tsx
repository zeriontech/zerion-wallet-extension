import React from 'react';
import { animated, useTransition } from '@react-spring/web';

export function SlidingRectangle({
  src,
  size,
  render,
}: {
  size: number;
  src: string;
  render: (src: string, index: number) => React.ReactNode;
}) {
  const transitions = useTransition([src], {
    from: { y: size * 0.666, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 0 - size * 0.666, opacity: 0 },
  });
  return transitions((style, value, _x, index) => (
    <animated.div style={style}>{render(value, index)}</animated.div>
  ));
}
