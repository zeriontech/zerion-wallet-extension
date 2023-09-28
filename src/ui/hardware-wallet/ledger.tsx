import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  checkDevice,
  getAddresses,
  signTransaction,
} from 'hardware-wallet-connection';
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useSearchParams,
} from 'react-router-dom';
import browser from 'webextension-polyfill';
import { createRoot } from 'react-dom/client';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
} from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { DerivationPathType } from 'src/shared/wallet/getNextAccountPath';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { RPCPort } from 'src/ui/shared/channels.types';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { ViewError } from 'src/ui/components/ViewError';
import { DesignTheme } from 'src/ui/components/DesignTheme';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import type { ThemeState } from 'src/ui/features/appearance/ThemeState';
import { applyTheme } from 'src/ui/features/appearance/applyTheme';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WalletListPresentation } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/WalletList';
import { PageColumn } from 'src/ui/components/PageColumn';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { isObj } from 'src/shared/isObj';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { useBodyStyle } from '../components/Background/Background';
import type { DeviceConnection, LedgerAccountImport } from './types';
import { ConnectLedgerDevice } from './ConnectLedgerDevice';

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

function AddressSelectList({
  ledger,
  pathType,
  onImport,
}: {
  pathType: DerivationPathType;
  ledger: DeviceConnection;
  onImport: (values: DeviceAccount[]) => void;
}) {
  const { appEth } = ledger;
  const COUNT = 5;
  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['ledger/addresses', COUNT, pathType, appEth],
    queryKeyHashFn: (queryKey) => queryKey.filter((x) => x !== appEth).join(''),
    queryFn: async ({ pageParam = 0 }) => {
      return getAddresses(appEth, {
        type: pathType as 'ledger' | 'ledgerLive',
        from: pageParam,
        count: COUNT,
      });
    },
    getNextPageParam: (_lastPage, allPages) => {
      return allPages.reduce((sum, items) => sum + items.length, 0);
    },
    staleTime: Infinity, // addresses found on ledger will not change
  });
  const itemsByAddress = useMemo(
    () =>
      new Map(
        data?.pages.flatMap((items) =>
          items.map((item) => [item.account.address, item])
        )
      ),
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
    return null;
  }
  return (
    <VStack gap={12}>
      <WalletListPresentation
        values={values}
        derivationPathType={pathType}
        wallets={data.pages.flatMap((items) =>
          items.map((item) => ({
            address: item.account.address,
            name: null,
            privateKey: '<ledger-private-key>',
            mnemonic: {
              path: item.derivationPath,
              phrase: '<ledger-mnemonic>',
            },
          }))
        )}
        renderDetail={null}
        initialCount={COUNT}
        listTitle="Select Addresses to Import"
        onSelect={toggleAddress}
        existingAddressesSet={new Set()}
        hasMore={true} // ledger can derive infinite amount of addresses
        isLoadingMore={isFetchingNextPage}
        onLoadMore={() => {
          fetchNextPage();
        }}
      />
      <Button
        kind="primary"
        disabled={values.size === 0}
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
        {'Next' + (values.size ? ` (${values.size})` : '')}
      </Button>
    </VStack>
  );
}

function ImportLedgerAddresses({
  ledger,
  onImport,
}: {
  ledger: DeviceConnection;
  onImport: (values: DeviceAccount[]) => void;
}) {
  const [pathType, setPathType] = useState<DerivationPathType>('ledgerLive');
  return (
    <VStack gap={24}>
      <SegmentedControlGroup style={{ paddingTop: 4 }}>
        <SegmentedControlRadio
          name="pathType"
          value="ledger"
          checked={pathType === 'ledger'}
          onChange={(event) =>
            setPathType(event.currentTarget.value as DerivationPathType)
          }
        >
          Ledger
        </SegmentedControlRadio>
        <SegmentedControlRadio
          name="pathType"
          value="ledgerLive"
          checked={pathType === 'ledgerLive'}
          onChange={(event) =>
            setPathType(event.currentTarget.value as DerivationPathType)
          }
        >
          Ledger Live
        </SegmentedControlRadio>
      </SegmentedControlGroup>
      <AddressSelectList
        key={pathType}
        ledger={ledger}
        pathType={pathType}
        onImport={onImport}
      />
    </VStack>
  );
}

type Strategy = 'connect' | 'import';

function Main({
  onPostMessage,
  strategy,
}: {
  strategy: Strategy;
  onPostMessage: (data: unknown) => void;
}) {
  const [ledger, setLedger] = useState<DeviceConnection | null>(null);
  if (ledger) {
    return (
      <ImportLedgerAddresses
        ledger={ledger}
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
          onPostMessage({ type: 'ledger/import', params: importData });
        }}
      />
    );
  } else {
    return (
      <>
        <ConnectLedgerDevice
          onConnect={(data) => {
            if (strategy === 'connect') {
              onPostMessage({ type: 'ledger/connect' });
            } else {
              setLedger(data);
            }
          }}
        />
      </>
    );
  }
}

interface SignTransactionParams {
  derivationPath: string;
  transaction: object;
}

function assertSignTransactionParams(
  x: unknown
): asserts x is SignTransactionParams {
  if (
    isObj(x) &&
    typeof x.derivationPath === 'string' &&
    isObj(x.transaction)
  ) {
    // ok
  } else {
    throw new Error('Invalid Payload');
  }
}

class Controller {
  static async signTransaction(params: unknown) {
    await checkDevice();
    assertSignTransactionParams(params);
    // @ts-ignore params.transaction is object
    return signTransaction(params.derivationPath, params.transaction);
  }

  static async listener(event: MessageEvent) {
    if (isRpcRequest(event.data)) {
      const { id, method, params } = event.data;
      if (isClassProperty(Controller, method)) {
        try {
          // @ts-ignore
          const result = await Controller[method](params);
          window.parent.postMessage({ id, result }, window.location.origin);
        } catch (error) {
          window.parent.postMessage({ id, error }, window.location.origin);
        }
      }
    }
  }

  listen() {
    window.addEventListener('message', Controller.listener);
    return () => {
      window.removeEventListener('message', Controller.listener);
    };
  }
}

function SignTransaction() {
  const [controller] = useState(() => new Controller());
  useEffect(() => {
    return controller.listen();
  }, [controller]);
  return null;
}

function App({ requestId }: { requestId: string }) {
  const { mutate: invokeVerifySandbox } = useMutation({
    mutationFn: verifySandbox,
    useErrorBoundary: true,
  });
  const [params] = useSearchParams();
  useEffect(() => {
    invokeVerifySandbox();
  }, [invokeVerifySandbox]);
  const handlePostMessage = (data: unknown) => {
    window.parent.postMessage({ id: requestId, data }, window.location.origin);
  };
  return (
    <PageColumn>
      <Routes>
        <Route
          path="/"
          element={
            <Main
              strategy={(params.get('strategy') as Strategy) || 'import'}
              onPostMessage={handlePostMessage}
            />
          }
        />
        <Route path="/signTransaction" element={<SignTransaction />} />
        <Route
          path="/other"
          element={
            <div>
              Other <Link to="/">main</Link>
            </div>
          }
        />
      </Routes>
    </PageColumn>
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

function FullBodyHeight() {
  useBodyStyle(useMemo(() => ({ height: '100vh' }), []));
  return null;
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
            <React.Suspense
              fallback={
                <>
                  <FullBodyHeight />
                  <ViewLoading />
                </>
              }
            >
              <App requestId={requestId} />
            </React.Suspense>
          </ErrorBoundary>
        </HashRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

renderApp();
