import type { JSX } from 'react';
export function PseudoRoute({ when, component }: { when: boolean; component: JSX.Element }) {
  if (when) {
    return component;
  }
  return null;
}
