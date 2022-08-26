import React from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { FillView } from '../FillView';

export function ViewLoading() {
  return (
    <FillView>
      <CircleSpinner color="var(--primary)" size="24px" />
    </FillView>
  );
}
