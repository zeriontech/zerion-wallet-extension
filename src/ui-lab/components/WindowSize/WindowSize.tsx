import React from 'react';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { ViewError } from 'src/ui/components/ViewError';

export function WindowSize({ children }: React.PropsWithChildren<unknown>) {
  return (
    <div
      style={{
        position: 'relative',
        maxWidth: 400,
        minHeight: 600,
        border: '1px solid var(--neutral-200)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ErrorBoundary
        renderError={(error) => (
          <FillView>
            <ViewError error={error} />
          </FillView>
        )}
      >
        {children}
      </ErrorBoundary>
    </div>
  );
}
