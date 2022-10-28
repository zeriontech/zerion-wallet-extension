import { ethers } from 'ethers';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DesignTheme } from 'src/ui/components/DesignTheme';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { ViewError } from 'src/ui/components/ViewError';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { configureClient } from './defi-sdk';
import { readmes } from './readmes';
import './lab.module.css';

Object.assign(window, { ethers });

const queryClient = new QueryClient();
configureClient();

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
          <UIText kind="h/2_sb">Hello, UI Lab</UIText>

          <VStack gap={56}>
            {readmes.map((readme, index) => (
              <VStack gap={12} key={index}>
                <UIText kind="h/6_med">{readme.name}</UIText>

                {React.createElement(readme.component)}
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
