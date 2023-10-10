import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { HashRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { ViewError } from 'src/ui/components/ViewError';
import { DesignTheme } from 'src/ui/components/DesignTheme';
import 'src/ui/style/global.module.css';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import type { ThemeState } from 'src/ui/features/appearance/ThemeState';
import { applyTheme } from 'src/ui/features/appearance/applyTheme';
import type { RpcRequest, RpcResponse } from 'src/shared/custom-rpc';
import { nanoid } from 'nanoid';
import {
  useBackgroundKind,
  useBodyStyle,
} from '../components/Background/Background';
import type { DeviceConnection, LedgerAccountImport } from './types';
import { ConnectLedgerDevice } from './ConnectLedgerDevice';
import { verifySandbox } from './shared/verifySandbox';
import { SignTransaction } from './SignTransaction';
import { ImportLedgerAddresses } from './ImportLedgerAddresses';
import { SignMessage } from './SignMessage';

type Strategy = 'connect' | 'import';

function ConnectDeviceFlow({
  onPostMessage,
  strategy,
}: {
  strategy: Strategy;
  onPostMessage: (data: RpcRequest | RpcResponse) => void;
}) {
  useBodyStyle(useMemo(() => ({ ['--body-height' as string]: '100vh' }), []));
  const [params] = useSearchParams();
  const existingAddressesSet = useMemo(() => {
    const addresses = params.get('existingAddresses[]');
    return new Set(addresses?.split(','));
  }, [params]);
  const [ledger, setLedger] = useState<DeviceConnection | null>(null);
  if (ledger) {
    return (
      <ImportLedgerAddresses
        ledger={ledger}
        existingAddressesSet={existingAddressesSet}
        onImport={(accounts) => {
          // @ts-ignore
          const device = ledger.appEth.transport.device as USBDevice;
          const importData: LedgerAccountImport = {
            accounts,
            device: {
              productId: device.productId,
              vendorId: device.vendorId,
              productName: device.productName,
            },
            provider: 'ledger',
          };
          onPostMessage({
            id: nanoid(),
            method: 'ledger/import',
            params: importData,
          });
        }}
      />
    );
  } else {
    return (
      <ConnectLedgerDevice
        onConnect={(data) => {
          if (strategy === 'connect') {
            onPostMessage({ id: nanoid(), method: 'ledger/connect' });
          } else {
            setLedger(data);
          }
        }}
      />
    );
  }
}

function App() {
  useBackgroundKind({ kind: 'white' });
  const { mutate: invokeVerifySandbox } = useMutation({
    mutationFn: verifySandbox,
    useErrorBoundary: true,
  });
  const [params] = useSearchParams();
  useEffect(() => {
    invokeVerifySandbox();
  }, [invokeVerifySandbox]);
  const handlePostMessage = (data: RpcRequest | RpcResponse) => {
    window.parent.postMessage(data, window.location.origin);
  };
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ConnectDeviceFlow
            strategy={(params.get('strategy') as Strategy) || 'import'}
            onPostMessage={handlePostMessage}
          />
        }
      />
      <Route path="/signTransaction" element={<SignTransaction />} />
      <Route path="/personalSign" element={<SignMessage />} />
      <Route path="/signTypedData_v4" element={<SignMessage />} />
    </Routes>
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

function IframeDesignTheme() {
  const pageUrl = new URL(window.location.href);
  const themeStateParam = pageUrl.searchParams.get('theme-state');
  invariant(themeStateParam, 'theme-state param is requred');
  const themeState = JSON.parse(themeStateParam) as ThemeState;
  useLayoutEffect(() => {
    applyTheme(themeState.theme);
  }, [themeState.theme]);

  return <DesignTheme />;
}

function ViewLoadingFillHeight() {
  useBodyStyle(useMemo(() => ({ height: '100vh' }), []));
  return <ViewLoading />;
}

function renderApp() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }

  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ErrorBoundary renderError={(error) => <ViewError error={error} />}>
            <IframeDesignTheme />
            <React.Suspense fallback={<ViewLoadingFillHeight />}>
              <App />
            </React.Suspense>
          </ErrorBoundary>
        </HashRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

renderApp();
