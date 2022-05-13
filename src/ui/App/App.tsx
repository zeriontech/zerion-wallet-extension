import React, { useEffect, useRef, useState } from 'react';
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
import { RouteResolver } from 'src/ui/pages/RouteResolver';
import { RequestAccounts } from 'src/ui/pages/RequestAccounts';
import { SendTransaction } from 'src/ui/pages/SendTransaction';
import { Login } from '../pages/Login';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { VStack } from '../ui-kit/VStack';
import { UIText } from '../ui-kit/UIText';
import { accountPublicRPCPort } from '../shared/channels';
import { CreateAccount } from '../pages/CreateAccount';
import { getPageTemplateName } from '../shared/getPageTemplateName';
import { closeOtherWindows } from '../shared/closeOtherWindows';

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
    if (page === 'dialog.html') {
      return;
    }
    if (!locationStore.ready || !enabled) {
      return;
    }
    console.log('usePersistLocation, setting', pathname);
    locationStore.setState((s) => ({ ...s, pathname, search }));
  }, [pathname, search, enabled]);
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

function URLBar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div
      style={{
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <button onClick={() => navigate(-1)} style={{ padding: 8 }}>
        {'<'}
      </button>

      <div
        style={{
          flexGrow: 1,
          borderRadius: 1000,
          background: 'lightgray',
          padding: 2,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: '#f0f0f0',
          color: 'black',
          whiteSpace: 'nowrap',
          overflowX: 'auto',
        }}
      >
        🌐 {location.pathname}
        {location.search}
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  console.log('RequireAuth');
  const location = useLocation();
  const { data: isAuthenticated, ...isAuthenticatedQuery } = useQuery(
    'isAuthenticated',
    () => accountPublicRPCPort.request('isAuthenticated')
  );
  const { data: existingUser, ...getExistingUserQuery } = useQuery(
    'getExistingUser',
    () => accountPublicRPCPort.request('getExistingUser')
  );

  if (isAuthenticatedQuery.isFetching || getExistingUserQuery.isFetching) {
    return null;
  }
  console.log({ existingUser, isAuthenticated });
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

const template = getPageTemplateName();

function useRedirectToSavedLocation({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialLocationRef = useRef(location.pathname);
  const [ready, setReady] = useState(!enabled || template !== '/popup.html');
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
  }, []);
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
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <URLBar />
        <Routes>
          <Route path="/" element={<Intro />} />
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
        </Routes>
      </div>
    </RouteResolver>
  );
}

const queryClient = new QueryClient();

// const pathParts = window.location.pathname.split('/');
// const baseName = pathParts[1].endsWith('.html')
//   ? `/${pathParts[1]}`
//   : undefined;
const templateName = getPageTemplateName();

export function App() {
  useEffect(() => {
    if (templateName === '/popup.html') {
      closeOtherWindows();
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary
          renderError={(error) => (
            <div
              style={{
                height: '100%',
                display: 'grid',
                placeContent: 'center',
                textAlign: 'center',
                padding: 20,
              }}
            >
              <VStack gap={8}>
                <UIText kind="h/2_med">Oops</UIText>
                <UIText kind="subtitle/s_reg">{error?.message}</UIText>
              </VStack>
            </div>
          )}
        >
          <Views />
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}
