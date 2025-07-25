import React, { useMemo } from 'react';
import { AreaProvider } from 'react-area';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import dayjs from 'dayjs';
import { DefiSdkClientProvider as DefiSdkClientContextProvider } from 'defi-sdk';
import * as styles from 'src/ui/style/global.module.css';
import relativeTime from 'dayjs/plugin/relativeTime';
import { GetStarted } from 'src/ui/pages/GetStarted';
import { Intro } from 'src/ui/pages/Intro';
import { Overview } from 'src/ui/pages/Overview';
import { RouteResolver } from 'src/ui/pages/RouteResolver';
import { RequestAccounts } from 'src/ui/pages/RequestAccounts';
import { SendTransaction } from 'src/ui/pages/SendTransaction';
import { SignMessage } from 'src/ui/pages/SignMessage';
import { SignTypedData } from 'src/ui/pages/SignTypedData';
import { useStore } from '@store-unit/react';
import { runtimeStore } from 'src/shared/core/runtime-store';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { Playground } from 'src/ui-lab/Playground';
import { Login } from '../pages/Login';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  accountPublicRPCPort,
  walletPort,
  windowPort,
} from '../shared/channels';
import { CreateAccount } from '../pages/CreateAccount';
import { URLBar } from '../components/URLBar';
import { SwitchEthereumChain } from '../pages/SwitchEthereumChain';
import { DesignTheme } from '../components/DesignTheme';
import { FillView } from '../components/FillView';
import { ViewError } from '../components/ViewError';
import { ViewArea } from '../components/ViewArea';
import { Settings } from '../pages/Settings';
import { Networks } from '../pages/Networks';
import { ManageWallets } from '../pages/ManageWallets';
import { WalletSelect } from '../pages/WalletSelect';
import { NotFoundPage } from '../components/NotFoundPage';
import { UIText } from '../ui-kit/UIText';
import { defaultUIContextValue, UIContext } from '../components/UIContext';
import { ConnectedSites } from '../pages/ConnectedSites';
import { InactivityDetector } from '../components/Session/InactivityDetector';
import { SessionResetHandler } from '../components/Session/SessionResetHandler';
import { ViewSuspense } from '../components/ViewSuspense';
import { VersionUpgrade } from '../components/VersionUpgrade';
import { queryClient } from '../shared/requests/queryClient';
import { ForgotPassword } from '../pages/ForgotPassword';
import { AbilityPage } from '../pages/Feed/Ability';
import { FooterBugReportButton } from '../components/BugReportButton';
import { Receive } from '../pages/Receive';
import { KeyboardShortcut } from '../components/KeyboardShortcut';
import { initialize as initializeApperance } from '../features/appearance';
import { HandshakeFailure } from '../components/HandshakeFailure';
import { useScreenViewChange } from '../shared/useScreenViewChange';
import { NonFungibleToken } from '../pages/NonFungibleToken';
import { AddEthereumChain } from '../pages/AddEthereumChain';
import { TestnetModeGuard } from '../pages/TestnetModeGuard';
import { useBodyStyle } from '../components/Background/Background';
import { PhishingWarningPage } from '../components/PhishingDefence/PhishingWarningPage';
import { HardwareWalletConnection } from '../pages/HardwareWalletConnection';
import { ThemeDecoration } from '../components/DesignTheme/ThemeDecoration';
import { SendForm } from '../pages/SendForm';
import { SwapForm } from '../pages/SwapForm';
import { MintDnaFlow } from '../DNA/pages/MintDnaFlow';
import { UpgradeDnaFlow } from '../DNA/pages/UpgradeDnaFlow';
import { ChooseGlobalProviderGuard } from '../pages/RequestAccounts/ChooseGlobalProvider/ChooseGlobalProvider';
import { usePreferences } from '../features/preferences';
import { openUrl } from '../shared/openUrl';
import { TestModeDecoration } from '../features/testnet-mode/TestModeDecoration';
import { Onboarding } from '../features/onboarding';
import { RevealPrivateKey } from '../pages/RevealPrivateKey';
import { urlContext } from '../../shared/UrlContext';
import { BackupPage } from '../pages/Backup/Backup';
import { AssetInfo } from '../pages/AssetInfo';
import { ProgrammaticNavigationHelper } from '../shared/routing/ProgrammaticNavigationHelper';
import { Invite } from '../features/referral-program';
import { XpDrop } from '../features/xp-drop';
import { BridgeForm } from '../pages/BridgeForm';
import { TurnstileTokenHandler } from '../features/turnstile';
import { AnalyticsIdHandler } from '../shared/analytics/AnalyticsIdHandler';
import { RouteRestoration, registerPersistentRoute } from './RouteRestoration';

const isProd = process.env.NODE_ENV === 'production';

function DefiSdkClientProvider({ children }: React.PropsWithChildren) {
  const client = useDefiSdkClient();
  return <DefiSdkClientContextProvider client={client} children={children} />;
}

const useAuthState = () => {
  const { data, isFetching } = useQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      const [isAuthenticated, existingUser, wallet] = await Promise.all([
        accountPublicRPCPort.request('isAuthenticated'),
        accountPublicRPCPort.request('getExistingUser'),
        walletPort.request('uiGetCurrentWallet'),
      ]);
      return {
        isAuthenticated,
        existingUser,
        wallet,
      };
    },
    useErrorBoundary: true,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { isAuthenticated, existingUser, wallet } = data || {};
  return {
    isAuthenticated,
    existingUser,
    hasWallet: Boolean(wallet),
    isLoading: isFetching,
  };
};

function SomeKindOfResolver({
  noUser,
  noWallet,
  notAuthenticated,
  authenticated,
}: {
  noUser: JSX.Element;
  noWallet: JSX.Element;
  notAuthenticated: JSX.Element;
  authenticated: JSX.Element;
}) {
  const { isLoading, isAuthenticated, existingUser, hasWallet } =
    useAuthState();
  if (isLoading) {
    return null;
  }
  if (!existingUser) {
    return noUser;
  }
  if (!isAuthenticated) {
    return notAuthenticated;
  }
  if (!hasWallet) {
    return noWallet;
  }
  return authenticated;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, existingUser } = useAuthState();

  if (isLoading) {
    return null;
  }

  if (!existingUser) {
    return <Navigate to="/" replace={true} />;
  } else if (!isAuthenticated) {
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

function PageLayoutViews() {
  // TODO: Should these be a part of <Views />?
  return (
    <Routes>
      <Route path="/mint-dna/*" element={<MintDnaFlow />} />
      <Route path="/upgrade-dna/*" element={<UpgradeDnaFlow />} />

      <Route
        path="/backup/*"
        element={
          <RequireAuth>
            <BackupPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function MaybeTestModeDecoration() {
  const { preferences } = usePreferences();
  return preferences?.testnetMode ? <TestModeDecoration /> : null;
}

function Views({ initialRoute }: { initialRoute?: string }) {
  useScreenViewChange();

  const isPopup = urlContext.windowType === 'popup';
  return (
    <RouteResolver>
      <ViewArea>
        <URLBar />
        {isPopup ? <RouteRestoration /> : null}
        <Routes>
          {initialRoute ? (
            <Route path="/" element={<Navigate to={initialRoute} />} />
          ) : null}
          <Route
            path="/"
            element={
              <SomeKindOfResolver
                noUser={<Navigate to="/intro" replace={true} />}
                noWallet={<Navigate to="/get-started?intro" replace={true} />}
                notAuthenticated={<Navigate to="/login" replace={true} />}
                authenticated={<Navigate to="/overview" replace={true} />}
              />
            }
          />
          <Route path="/intro" element={<Intro />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/get-started/*" element={<GetStarted />} />
          <Route
            path="/connect-hardware-wallet/*"
            element={<HardwareWalletConnection />}
          />
          <Route path="/receive" element={<Receive />} />
          <Route path="/phishing-warning" element={<PhishingWarningPage />} />
          <Route
            path="/nft/:chain/:asset_code"
            element={
              <RequireAuth>
                <NonFungibleToken />
              </RequireAuth>
            }
          />
          <Route
            path="/overview/*"
            element={
              <RequireAuth>
                <Overview />
              </RequireAuth>
            }
          />
          <Route
            path="/asset/:asset_code"
            element={
              <RequireAuth>
                <AssetInfo />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/*"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/networks-select"
            element={
              <RequireAuth>
                <Networks />
              </RequireAuth>
            }
          />
          <Route
            path="/networks/*"
            element={
              <RequireAuth>
                <Networks />
              </RequireAuth>
            }
          />
          <Route
            path="/reveal-private-key/*"
            element={
              <RequireAuth>
                <RevealPrivateKey />
              </RequireAuth>
            }
          />
          <Route
            path="/requestAccounts"
            element={
              <ChooseGlobalProviderGuard>
                <RequireAuth>
                  <RequestAccounts />
                </RequireAuth>
              </ChooseGlobalProviderGuard>
            }
          />
          <Route
            path="/sendTransaction/*"
            element={
              <RequireAuth>
                <SendTransaction />
              </RequireAuth>
            }
          />
          <Route path="/testnetModeGuard" element={<TestnetModeGuard />} />
          <Route
            path="/signMessage"
            element={
              <RequireAuth>
                <SignMessage />
              </RequireAuth>
            }
          />
          <Route
            path="/signTypedData"
            element={
              <RequireAuth>
                <SignTypedData />
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
            path="/addEthereumChain/*"
            element={
              <RequireAuth>
                <AddEthereumChain />
              </RequireAuth>
            }
          />
          <Route
            path="/wallets/*"
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
            path="/connected-sites/*"
            element={
              <RequireAuth>
                <ConnectedSites />
              </RequireAuth>
            }
          />
          <Route path="/handshake-failure" element={<HandshakeFailure />} />
          <Route
            path="/ability/:ability_uid"
            element={
              <RequireAuth>
                <AbilityPage />
              </RequireAuth>
            }
          />
          <Route
            path="/send-form/*"
            element={
              <RequireAuth>
                <SendForm />
              </RequireAuth>
            }
          />
          <Route
            path="/swap-form/*"
            element={
              <RequireAuth>
                <SwapForm />
              </RequireAuth>
            }
          />
          <Route
            path="/bridge-form/*"
            element={
              <RequireAuth>
                <BridgeForm />
              </RequireAuth>
            }
          />
          <Route
            path="/invite/*"
            element={
              <RequireAuth>
                <Invite />
              </RequireAuth>
            }
          />
          <Route
            path="/xp-drop/*"
            element={
              <RequireAuth>
                <XpDrop />
              </RequireAuth>
            }
          />
          <Route
            path="/not-implemented"
            element={
              <FillView>
                <UIText
                  kind="body/regular"
                  color="var(--neutral-500)"
                  style={{ padding: 20, textAlign: 'center' }}
                >
                  This View is not Implemented
                </UIText>
              </FillView>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ViewArea>
    </RouteResolver>
  );
}

initializeApperance();
dayjs.extend(relativeTime);
registerPersistentRoute('/send-form');
registerPersistentRoute('/swap-form');
registerPersistentRoute('/bridge-form');

function GlobalKeyboardShortcuts() {
  const isDialog = urlContext.windowType === 'dialog';
  return (
    <>
      {isDialog ? (
        <KeyboardShortcut
          combination="esc"
          onKeyDown={() => {
            const searchParams = new URLSearchParams(window.location.hash);
            const windowId = searchParams.get('windowId');
            if (windowId) {
              windowPort.reject(windowId);
            }
          }}
        />
      ) : null}

      <KeyboardShortcut
        combination="ctrl+alt+0"
        onKeyDown={() => {
          // Helper for development and debugging :)
          const url = new URL(window.location.href);
          openUrl(url, { windowType: 'tab' });
        }}
      />
    </>
  );
}

export interface AppProps {
  initialView?: 'handshakeFailure';
  inspect?: { message: string };
}

export function App({ initialView, inspect }: AppProps) {
  const isOnboardingMode = urlContext.appMode === 'onboarding';
  const isPageLayout = urlContext.windowLayout === 'page';

  const bodyClassList = useMemo(() => {
    const result = [];

    const isDialog = urlContext.windowType === 'dialog';
    const isTab = urlContext.windowType === 'tab';
    const isSidepanel = urlContext.windowType === 'sidepanel';

    if (isDialog) {
      result.push(styles.isDialog);
    } else if (isTab) {
      result.push(styles.isTab);
    } else if (isSidepanel) {
      result.push(styles.isSidepanel);
    }
    if (isOnboardingMode || isPageLayout) {
      result.push(styles.pageLayout);
    }
    return result;
  }, [isOnboardingMode, isPageLayout]);

  const { connected } = useStore(runtimeStore);

  useBodyStyle(
    useMemo(() => ({ opacity: connected ? '' : '0.6' }), [connected])
  );

  const isOnboardingView =
    isOnboardingMode && initialView !== 'handshakeFailure';

  return (
    <AreaProvider>
      <UIContext.Provider value={defaultUIContextValue}>
        <QueryClientProvider client={queryClient}>
          <AnalyticsIdHandler />
          <DesignTheme bodyClassList={bodyClassList} />
          <Router>
            <ErrorBoundary renderError={(error) => <ViewError error={error} />}>
              <InactivityDetector />
              <SessionResetHandler />
              <TurnstileTokenHandler />
              <ProgrammaticNavigationHelper />
              <ThemeDecoration />
              {inspect && !isProd ? (
                <UIText
                  kind="small/regular"
                  style={{
                    borderBottom: '1px solid var(--neutral-300)',
                    paddingInline: 12,
                  }}
                >
                  {inspect.message}
                </UIText>
              ) : null}
              <GlobalKeyboardShortcuts />
              <VersionUpgrade>
                {!isOnboardingView && !isPageLayout ? (
                  // Render above <ViewSuspense /> so that it doesn't flicker
                  <MaybeTestModeDecoration />
                ) : null}
                <ViewSuspense logDelays={true}>
                  <Routes>
                    <Route path="/playground/*" element={<Playground />} />
                    <Route
                      path="*"
                      element={
                        isOnboardingView ? (
                          <Onboarding />
                        ) : isPageLayout ? (
                          <PageLayoutViews />
                        ) : (
                          <DefiSdkClientProvider>
                            <Views
                              initialRoute={
                                initialView === 'handshakeFailure'
                                  ? '/handshake-failure'
                                  : undefined
                              }
                            />
                          </DefiSdkClientProvider>
                        )
                      }
                    />
                  </Routes>
                </ViewSuspense>
              </VersionUpgrade>
            </ErrorBoundary>
            <FooterBugReportButton />
          </Router>
        </QueryClientProvider>
      </UIContext.Provider>
    </AreaProvider>
  );
}
