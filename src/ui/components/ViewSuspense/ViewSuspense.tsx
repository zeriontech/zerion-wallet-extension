import React from 'react';
import { DelayedRender } from '../DelayedRender';
import { NavigationTitle } from '../NavigationTitle';
import { ViewLoading } from '../ViewLoading';

export function ViewSuspense({ children }: React.PropsWithChildren) {
  return (
    <React.Suspense
      fallback={
        <>
          {/* empty navigation title to avoid flickering during route change */}
          <NavigationTitle title={null} documentTitle="" />
          <DelayedRender>
            <ViewLoading />
          </DelayedRender>
        </>
      }
    >
      {children}
    </React.Suspense>
  );
}
