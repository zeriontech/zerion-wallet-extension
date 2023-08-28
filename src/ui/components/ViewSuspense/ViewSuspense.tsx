import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { emitter } from 'src/ui/shared/events';
import { DelayedRender } from '../DelayedRender';
import { NavigationTitle } from '../NavigationTitle';
import { ViewLoading } from '../ViewLoading';
import { useRenderDelay } from '../DelayedRender/DelayedRender';

function DelayLogger() {
  const sessionId = useRef(uuidv4());
  const { pathname } = useLocation();
  const logSmallDelay = useRenderDelay(3000);
  const logLongDelay = useRenderDelay(8000);

  useEffect(() => {
    if (logSmallDelay) {
      emitter.emit('loaderScreenView', {
        sessionId: sessionId.current,
        location: pathname,
        duration: 3000,
      });
    }
  }, [logSmallDelay, pathname]);

  useEffect(() => {
    if (logLongDelay) {
      emitter.emit('loaderScreenView', {
        sessionId: sessionId.current,
        location: pathname,
        duration: 8000,
      });
    }
  }, [logLongDelay, pathname]);

  return null;
}

export function ViewSuspense({
  children,
  logDelays,
}: React.PropsWithChildren<{ logDelays?: boolean }>) {
  return (
    <React.Suspense
      fallback={
        <>
          {/* empty navigation title to avoid flickering during route change */}
          <NavigationTitle
            title={null}
            documentTitle=""
            ignoreDocumentTitle_DO_NOT_USE_EXCEPT_FOR_LOADING_VIEW={true}
          />
          <DelayedRender>
            <ViewLoading />
          </DelayedRender>
          {logDelays ? <DelayLogger /> : null}
        </>
      }
    >
      {children}
    </React.Suspense>
  );
}
