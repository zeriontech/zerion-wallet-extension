import { ethers } from 'ethers';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from 'react-query';
import { Button } from 'src/ui/ui-kit/Button';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { DesignTheme } from 'src/ui/components/DesignTheme';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { ViewError } from 'src/ui/components/ViewError';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { configureClient } from './defi-sdk';
import { readmes } from './readmes';
import './lab.module.css';
import type { Readme } from './types';

Object.assign(window, { ethers });

configureClient();

function ReadmeComponent({ readme }: { readme: Readme }) {
  return React.createElement(readme.component);
}

function Details({
  summary,
  content,
}: {
  summary: (opts: {
    isOpen: boolean;
    bind: { onClick: () => void };
  }) => React.ReactNode;
  content: React.ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      {summary({ isOpen, bind: { onClick: () => setOpen((x) => !x) } })}
      {isOpen ? content : null}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        renderError={(error) => (
          <FillView>
            <ViewError error={error} />
          </FillView>
        )}
      >
        <DesignTheme />
        <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 16 }}>
          <UIText kind="headline/h1">Hello, UI Lab</UIText>

          <VStack gap={12}>
            {readmes.map((readme, index) => (
              <VStack gap={12} key={index}>
                <Details
                  summary={({ isOpen, bind }) => (
                    <Button
                      {...bind}
                      kind="ghost"
                      style={{
                        maxWidth: 300,
                        textAlign: 'start',
                        paddingInline: 16,
                      }}
                    >
                      <HStack gap={8} justifyContent="space-between">
                        <UIText kind="headline/h3">{readme.name}</UIText>
                        <ChevronRightIcon
                          style={
                            isOpen ? { transform: 'rotate(90deg)' } : undefined
                          }
                        />
                      </HStack>
                    </Button>
                  )}
                  content={<ReadmeComponent readme={readme} />}
                />
              </VStack>
            ))}
          </VStack>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('#root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
