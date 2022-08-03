import React, { useEffect, useRef, useState } from 'react';
import { AreaProvider } from 'react-area';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
  Outlet,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import { GetStarted } from 'src/ui/pages/GetStarted';
import { Intro } from 'src/ui/pages/Intro';
import { PersistentStore } from 'src/shared/PersistentStore';
import { Overview } from 'src/ui/pages/Overview';
import { History } from 'src/ui/pages/History';
import { RouteResolver } from 'src/ui/pages/RouteResolver';
import { RequestAccounts } from 'src/ui/pages/RequestAccounts';
import { SendTransaction } from 'src/ui/pages/SendTransaction';
import { Login } from '../pages/Login';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { accountPublicRPCPort, walletPort } from '../shared/channels';
import { CreateAccount } from '../pages/CreateAccount';
import { getPageTemplateType } from '../shared/getPageTemplateName';
import { closeOtherWindows } from '../shared/closeOtherWindows';
import { URLBar } from '../components/URLBar';
import { SwitchEthereumChain } from '../pages/SwitchEthereumChain';
import { DesignTheme } from '../components/DesignTheme';
import { FillView } from '../components/FillView';
import { ViewError } from '../components/ViewError';
import { ViewArea } from '../components/ViewArea';
import { Settings } from '../pages/Settings';
import { Networks } from '../pages/Networks';
import { BackupWallet } from '../pages/BackupWallet';
import { ManageWallets } from '../pages/ManageWallets';
import { WalletSelect } from '../pages/WalletSelect';

const locationStore = new PersistentStore('location', {
  pathname: '/',
  search: '',
});

locationStore.ready().then(() => {
  console.log('locationStore ready', locationStore.getState());
});

function usePersistLocation({ enabled }: { enabled: boolean }) {
  const { pathname, search } = useLocation();
  const page = window.location.pathname;
  useEffect(() => {
    if (page && /dialog\.\w+\.html$/.test(page)) {
      return;
    }
    if (!locationStore.ready || !enabled) {
      return;
    }
    console.log('usePersistLocation, setting', pathname);
    locationStore.setState((s) => ({ ...s, pathname, search }));
  }, [pathname, search, enabled, page]);
}

function View() {
  const location = useLocation();
  return (
    <div>
      <div>Path: {location.pathname}</div>
      <div>window pathname: {window.location.pathname}</div>
      <div>window hash: {window.location.hash}</div>
      <div style={{ wordBreak: 'break-all' }}>
        window href: {window.location.href}
      </div>
      <div>
        <Link to="/hello">go to hello</Link>
      </div>
      <div>
        <Link to="/hello?param=one&hello=two">go to hello with params</Link>
      </div>
      <div>
        <Link to="/requestAccounts?param=one&hello=two">
          go to requestAccounts
        </Link>
      </div>
      outlet:
      <Outlet />
    </div>
  );
}

const useAuthState = () => {
  const { data: isAuthenticated, ...isAuthenticatedQuery } = useQuery(
    'isAuthenticated',
    () => accountPublicRPCPort.request('isAuthenticated')
  );
  const { data: existingUser, ...getExistingUserQuery } = useQuery(
    'getExistingUser',
    () => accountPublicRPCPort.request('getExistingUser')
  );
  const { data: wallet, ...currentWalletQuery } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
  });
  const isLoading =
    isAuthenticatedQuery.isFetching ||
    getExistingUserQuery.isFetching ||
    currentWalletQuery.isLoading;
  console.log(
    'useAuthState, isAuthenticated',
    isAuthenticated,
    wallet,
    currentWalletQuery.isError,
    currentWalletQuery.isFetched
  );
  return {
    isAuthenticated: Boolean(isAuthenticated && wallet),
    existingUser,
    isLoading,
  };
};

function SomeKindOfResolver({
  noUser,
  notAuthenticated,
  authenticated,
}: {
  noUser: JSX.Element;
  notAuthenticated: JSX.Element;
  authenticated: JSX.Element;
}) {
  const { isLoading, isAuthenticated, existingUser } = useAuthState();
  if (isLoading) {
    return null;
  }
  if (!existingUser) {
    return noUser;
  }
  if (!isAuthenticated) {
    return notAuthenticated;
  }
  return authenticated;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  console.log('RequireAuth');
  const location = useLocation();
  const { isLoading, isAuthenticated, existingUser } = useAuthState();

  if (isLoading) {
    return null;
  }
  console.log('RequireAuth', { existingUser, isAuthenticated });

  if (!existingUser) {
    console.log('no user, redirecting to /');
    return <Navigate to="/" replace={true} />;
  } else if (!isAuthenticated) {
    console.log('not authenticated, redirecting to /login?next=...');
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(
          `${location.pathname}${location.search}`
        )}`}
        replace={true}
      />
    );
  }

  return children;
}

const templateType = getPageTemplateType();

function useRedirectToSavedLocation({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialLocationRef = useRef(location.pathname);
  const [ready, setReady] = useState(!enabled || templateType !== 'popup');
  console.log('Views:', location.pathname, { ready });
  useEffect(() => {
    let active = true;
    if (ready) {
      return;
    }
    locationStore.ready().then(() => {
      console.log('locationStore is ready', locationStore.getState());
      if (!active) {
        return;
      }
      const { pathname, search } = locationStore.getState();
      if (pathname !== '/' && initialLocationRef.current === '/') {
        navigate({ pathname, search });
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [navigate, ready]);
  usePersistLocation({ enabled: ready });
  return { ready };
}
function Views() {
  console.log('Views', window.location.pathname, locationStore.getState());
  const { ready } = useRedirectToSavedLocation({ enabled: false });
  if (!ready) {
    return <span>not ready view</span>;
  }

  return (
    <RouteResolver>
      <ViewArea>
        <URLBar />
        <Routes>
          <Route
            path="/"
            element={
              <SomeKindOfResolver
                noUser={<Intro />}
                notAuthenticated={<Navigate to="/login" replace={true} />}
                authenticated={<Navigate to="/overview" replace={true} />}
              />
            }
          />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/get-started/*" element={<GetStarted />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hello" element={<View />} />
          <Route
            path="/overview"
            element={
              <RequireAuth>
                <Overview />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/networks"
            element={
              <RequireAuth>
                <Networks />
              </RequireAuth>
            }
          />
          <Route
            path="/backup-wallet/*"
            element={
              <RequireAuth>
                <BackupWallet />
              </RequireAuth>
            }
          />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <History />
              </RequireAuth>
            }
          />
          <Route
            path="/requestAccounts"
            element={
              <RequireAuth>
                <RequestAccounts />
              </RequireAuth>
            }
          />
          <Route
            path="/sendTransaction"
            element={
              <RequireAuth>
                <SendTransaction />
              </RequireAuth>
            }
          />
          <Route
            path="/switchEthereumChain"
            element={
              <RequireAuth>
                <SwitchEthereumChain />
              </RequireAuth>
            }
          />
          <Route
            path="/wallets"
            element={
              <RequireAuth>
                <ManageWallets />
              </RequireAuth>
            }
          />
          <Route
            path="/wallet-select"
            element={
              <RequireAuth>
                <WalletSelect />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <FillView>
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p>404 not found</p>
                </div>
              </FillView>
            }
          />
        </Routes>
      </ViewArea>
    </RouteResolver>
  );
}

const queryClient = new QueryClient();

export function App() {
  useEffect(() => {
    if (templateType === 'popup') {
      closeOtherWindows();
    }
  }, []);
  return (
    <AreaProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <DesignTheme />
          <ErrorBoundary
            renderError={(error) => (
              <FillView>
                <ViewError error={error} />
              </FillView>
            )}
          >
            <Views />
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
    </AreaProvider>
  );
}
