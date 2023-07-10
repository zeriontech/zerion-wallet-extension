import React, { useState } from 'react';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { UIContext } from 'src/ui/components/UIContext';
import { ViewError } from 'src/ui/components/ViewError';

export function WindowSize({
  children,
  style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
  const [refEl, setRefEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setRefEl}
      style={{
        position: 'relative',
        maxWidth: 400,
        height: 640,
        overflowY: 'auto',
        border: '1px solid var(--neutral-200)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {refEl == null ? null : (
        <UIContext.Provider value={{ uiScrollRootElement: refEl }}>
          <ErrorBoundary renderError={(error) => <ViewError error={error} />}>
            {children}
          </ErrorBoundary>
        </UIContext.Provider>
      )}
    </div>
  );
}
