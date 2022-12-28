import React from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { FillView } from '../FillView';

interface Props {
  size?: string;
  kind?: 'default' | 'network';
}

export function ViewLoading({ size = '24px', kind = 'default' }: Props) {
  return (
    <FillView>
      {!navigator.onLine && kind === 'network' ? (
        <UIText kind="body/regular" color="var(--neutral-600)">
          You are offline
        </UIText>
      ) : (
        <CircleSpinner color="var(--primary)" size={size} />
      )}
    </FillView>
  );
}
