import React, { useEffect } from 'react';
import { connectDevice } from 'hardware-wallet-connection';
import browser from 'webextension-polyfill';
import { createRoot } from 'react-dom/client';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import type { RPCPort } from '../shared/channels.types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ViewError } from '../components/ViewError';

const walletPort = new PortMessageChannel({
  name: `${browser.runtime.id}/wallet`,
}) as RPCPort<Wallet>;

async function verifySandbox() {
  /**
   * We expect to be in an isolated sandbox enviroment
   * To verify this, we try to query our own background script
   * It is EXPECTED to reject the request.
   * If it resolves successfully, we MUST halt the script
   * to indicate that some setup went wrong.
   */
  return walletPort.request('uiGetCurrentWallet').then(
    () => {
      throw new Error('Ledger code is not sandboxed!');
    },
    () => {
      return null; // we're safe
    }
  );
}

function App() {
  const { mutate: invokeVerifySandbox } = useMutation({
    mutationFn: verifySandbox,
    useErrorBoundary: true,
  });
  useEffect(() => {
    invokeVerifySandbox();
  }, [invokeVerifySandbox]);
  return (
    <div>
      <h1>Hello Ledger bundle react</h1>
      <button
        onClick={async () => {
          const { appEth, transport } = await connectDevice();
          console.log({ appEth, transport });
        }}
      >
        Connect Ledger
      </button>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      useErrorBoundary: true,
      suspense: true,
    },
  },
});

function renderApp() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }

  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <ErrorBoundary renderError={(error) => <ViewError error={error} />}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

renderApp();
