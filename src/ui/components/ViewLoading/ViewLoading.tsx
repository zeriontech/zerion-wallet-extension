import React from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { FillView } from '../FillView';

interface Props {
  size?: string;
}

export function ViewLoading({ size = '24px' }: Props) {
  return (
    <FillView>
      <CircleSpinner color="var(--primary)" size={size} />
    </FillView>
  );
}
