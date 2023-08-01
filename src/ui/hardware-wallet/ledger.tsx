import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  connectDevice,
  checkDevice,
  getAddresses,
} from 'hardware-wallet-connection';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { createRoot } from 'react-dom/client';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { getError } from 'src/shared/errors/getError';
import type { DerivationPathType } from 'src/shared/wallet/getNextAccountPath';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { RPCPort } from '../shared/channels.types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ViewError } from '../components/ViewError';
import { DesignTheme } from '../components/DesignTheme';
import type { ThemeState } from '../features/appearance/ThemeState';
import { applyTheme } from '../features/appearance/applyTheme';
import { Button } from '../ui-kit/Button';
import { UIText } from '../ui-kit/UIText';
import { VStack } from '../ui-kit/VStack';
import { ViewLoading } from '../components/ViewLoading';
import { WalletList } from '../pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/WalletList';
import type { LedgerAccountImport } from './types';

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

type DeviceConnection = Awaited<ReturnType<typeof connectDevice>>;

async function safelyConnectDevice() {
  try {
    return await checkDevice();
  } catch (e) {
    return connectDevice();
  }
}

function ConnectDevice({
  onConnect,
}: {
  onConnect: (data: DeviceConnection) => void;
}) {
  const {
    mutate: invokeConnectDevice,
    isLoading,
    isError,
    error: maybeError,
  } = useMutation({
    mutationFn: () => safelyConnectDevice(),
    onSuccess: (data) => {
      onConnect(data);
    },
  });
  const error = isError ? getError(maybeError) : null;
  return (
    <div>
      <ol>
        <li>Connect your Ledger to begin</li>
        <li>Open "Ethereum App" on your Ledger device</li>
        <li>
          Ensure that Browser Support and Contract Data are enabled in Settings
        </li>
        <li>
          You may need to update firmware is Browser Support is not available
        </li>
      </ol>
      <VStack gap={8}>
        <UIText kind="small/regular" color="var(--negative-500)">
          {error ? error.message : null}
        </UIText>
        <Button
          kind="primary"
          onClick={() => invokeConnectDevice()}
          style={{ width: '100%' }}
        >
          {isLoading ? 'Looking for device...' : 'Connect Device'}
        </Button>
      </VStack>
    </div>
  );
}

function ImportLedgerAddresses({
  ledger,
  onImport,
}: {
  ledger: DeviceConnection;
  onImport: (values: DeviceAccount[]) => void;
}) {
  const { appEth } = ledger;
  const derivationPathType: DerivationPathType = 'ledgerLive';
  const COUNT = 3;
  const { data } = useQuery({
    queryKey: ['ledger/addresses', appEth, COUNT],
    queryFn: () =>
      getAddresses(appEth, { type: 'ledgerLive', from: 0, count: COUNT }),
  });
  console.log({ data, appEth });
  const itemsByAddress = useMemo(
    () => new Map(data?.map((item) => [item.account.address, item])),
    [data]
  );
  const [values, setValue] = useState<Set<string>>(() => new Set());
  const toggleAddress = useCallback((value: string) => {
    setValue((set) => {
      const newSet = new Set(set);
      if (newSet.has(value)) {
        newSet.delete(value);
        return newSet;
      } else {
        return newSet.add(value);
      }
    });
  }, []);
  if (!data) {
    return <p>loading..</p>;
  }
  return (
    <VStack gap={12}>
      <WalletList
        values={values}
        derivationPathType={derivationPathType}
        wallets={data.map((item) => ({
          address: item.account.address,
          name: null,
          privateKey: '<ledger-private-key>',
          mnemonic: {
            path: item.derivationPath,
            phrase: '<ledger-mnemonic>',
          },
        }))}
        renderDetail={null}
        initialCount={COUNT}
        listTitle="Wallet List (temp title)"
        onSelect={toggleAddress}
        existingAddressesSet={new Set()}
      />
      <Button
        kind="primary"
        onClick={() => {
          onImport(
            Array.from(values).map((address) => {
              const item = itemsByAddress.get(address);
              invariant(item, `Record for ${address} not found`);
              return {
                address,
                name: null,
                derivationPath: item.derivationPath,
              };
            })
          );
        }}
      >
        Next
      </Button>
    </VStack>
  );
}

function Main({ onPostMessage }: { onPostMessage: (data: unknown) => void }) {
  const [ledger, setLedger] = useState<DeviceConnection | null>(null);
  if (ledger) {
    return (
      <ImportLedgerAddresses
        ledger={ledger}
        onImport={(accounts) => {
          console.log('should handle import', { accounts, ledger });
          const importData: LedgerAccountImport = {
            accounts,
            device: {
              productId: ledger.appEth.transport.device.productId,
              vendorId: ledger.appEth.transport.device.vendorId,
              productName: ledger.appEth.transport.device.productName,
            },
            provider: 'ledger',
          };
          onPostMessage({ type: 'ledger/import', params: importData });
        }}
      />
    );
  } else {
    return <ConnectDevice onConnect={(data) => setLedger(data)} />;
  }
}

function App({ requestId }: { requestId: string }) {
  const { mutate: invokeVerifySandbox } = useMutation({
    mutationFn: verifySandbox,
    useErrorBoundary: true,
  });
  useEffect(() => {
    invokeVerifySandbox();
  }, [invokeVerifySandbox]);
  const handlePostMessage = (data: unknown) => {
    window.parent.postMessage({ id: requestId, data }, window.location.origin);
  };
  return (
    <Routes>
      <Route path="/" element={<Main onPostMessage={handlePostMessage} />} />
      <Route
        path="/other"
        element={
          <div>
            Other <Link to="/">main</Link>
          </div>
        }
      />
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

function renderApp() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }
  const pageUrl = new URL(window.location.href);
  const requestId = pageUrl.searchParams.get('request-id');
  invariant(requestId, 'Sandboxed iframe requires a request-id param');

  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ErrorBoundary renderError={(error) => <ViewError error={error} />}>
            <IframeDesignTheme />
            <React.Suspense fallback={<ViewLoading />}>
              <App requestId={requestId} />
            </React.Suspense>
          </ErrorBoundary>
        </HashRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

renderApp();
