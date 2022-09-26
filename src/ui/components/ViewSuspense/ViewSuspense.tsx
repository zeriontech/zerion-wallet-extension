import React from 'react';
import { DelayedRender } from '../DelayedRender';
import { ViewLoading } from '../ViewLoading';

export function ViewSuspense({ children }: React.PropsWithChildren) {
  return (
    <React.Suspense
      fallback={
        <DelayedRender>
          <ViewLoading />
        </DelayedRender>
      }
    >
      {children}
    </React.Suspense>
  );
}
