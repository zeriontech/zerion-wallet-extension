import { UIText } from 'src/ui/ui-kit/UIText';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import React from 'react';
import { DelayedRender } from '../DelayedRender';

export function InterpretLoadingState() {
  return (
    <UIText kind="small/regular" color="var(--primary)">
      Analyzing...
      <br />
      <ZStack hideLowerElements={true}>
        <DelayedRender delay={11000}>
          <span style={{ color: 'var(--black)' }}>
            (Going to give up soon...)
          </span>
        </DelayedRender>
        <DelayedRender delay={6000}>
          <span style={{ color: 'var(--black)' }}>
            (Request is taking longer than usual...)
          </span>
        </DelayedRender>
      </ZStack>
    </UIText>
  );
}
