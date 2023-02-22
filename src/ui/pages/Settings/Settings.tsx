import React, { useMemo } from 'react';
import type { QueryClient } from 'react-query';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { WalletRecord } from 'src/shared/types/WalletRecord';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import WalletIcon from 'jsx:src/ui/assets/wallet.svg';
import LockIcon from 'jsx:src/ui/assets/lock.svg';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import DarkModeLampIcon from 'jsx:src/ui/assets/dark-mode-lamp.svg';
import { version } from 'src/shared/packageVersion';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { apostrophe } from 'src/ui/shared/typography';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { AppearancePage } from 'src/ui/features/appearance/AppearancePage';
import { BackupFlowSettingsSection } from '../BackupWallet/BackupSettingsItem';

function SettingsMain() {
  const navigate = useNavigate();
  const logout = useMutation(() => accountPublicRPCPort.request('logout'));
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={24}>
        <BackupFlowSettingsSection />
        <SurfaceList
          items={[
            {
              key: 0,
              to: '/wallets',
              component: (
                <AngleRightRow>
                  <HStack gap={4} alignItems="center">
                    <WalletIcon />
                    <UIText kind="body/regular">Manage Wallets</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 2,
              to: '/connected-sites',
              component: (
                <AngleRightRow>
                  <HStack gap={4} alignItems="center">
                    <GlobeIcon
                      // This icon doesn't fit, temporary hack to make it look better
                      style={{ color: 'var(--neutral-800)' }}
                    />
                    <UIText kind="body/regular">Connected Sites</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 3,
              to: '/settings/appearance',
              component: (
                <AngleRightRow>
                  <HStack gap={4} alignItems="center">
                    <DarkModeLampIcon />
                    <UIText kind="body/regular">Appearance</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 4,
              to: '/settings/user-preferences',
              component: (
                <AngleRightRow>
                  <HStack gap={4} alignItems="center">
                    <SettingsIcon />
                    <UIText kind="body/regular">Preferences</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 5,
              onClick: async () => {
                await logout.mutateAsync();
                navigate('/login');
              },
              component: (
                <HStack gap={4} alignItems="center">
                  <LockIcon style={{ color: 'var(--negative-500)' }} />
                  <UIText kind="body/regular" color="var(--negative-500)">
                    {logout.isLoading ? 'Locking...' : 'Lock'}
                  </UIText>
                </HStack>
              ),
            },
          ]}
        />
      </VStack>
      <Spacer height={8} />
      <UIText
        style={{ marginTop: 'auto', textAlign: 'end' }}
        kind="small/regular"
        color="var(--neutral-500)"
      >
        {`v${version}`}
      </UIText>
      <PageBottom />
    </PageColumn>
  );
}

type Preferences = WalletRecord['publicPreferences'];

function useOptimisticMutation<Args, Res, QueryType = unknown>(
  mutationFn: (...args: Args[]) => Promise<Res>,
  {
    relatedQueryKey: queryKey,
    onMutate,
  }: {
    relatedQueryKey: string;
    onMutate?: (info: { client: QueryClient; variables: Args }) => unknown;
  }
) {
  type OptimisticContext = { previous?: QueryType };
  const client = useQueryClient();
  return useMutation(mutationFn, {
    onMutate: async (variables): Promise<OptimisticContext> => {
      await client.cancelQueries(queryKey);
      const previous = client.getQueryData<QueryType | undefined>(queryKey);
      onMutate?.({ client, variables });
      return { previous };
    },
    onError: (_err, _args, context) => {
      client.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => client.invalidateQueries(queryKey),
  });
}

async function walletSetWalletNameFlag({
  flag,
  checked,
}: {
  flag: WalletNameFlag;
  checked: boolean;
}) {
  return walletPort.request('wallet_setWalletNameFlag', { flag, checked });
}
async function setPreferences(preferences: Preferences) {
  walletPort.request('setPreferences', { preferences });
}

async function setGlobalPreferences(preferences: GlobalPreferences) {
  walletPort.request('setGlobalPreferences', { preferences });
}

function UserPreferences() {
  const { data: preferences } = useQuery(
    'wallet/getPreferences',
    () => walletPort.request('getPreferences'),
    { useErrorBoundary: true, suspense: true }
  );
  const { data: globalPreferences } = useQuery(
    'wallet/getGlobalPreferences',
    () => walletPort.request('getGlobalPreferences'),
    { useErrorBoundary: true, suspense: true }
  );

  const { mutate: setWalletNameFlag } = useOptimisticMutation(
    walletSetWalletNameFlag,
    { relatedQueryKey: 'wallet/getPreferences' }
  );
  const preferencesMutation = useOptimisticMutation(setPreferences, {
    relatedQueryKey: 'wallet/getPreferences',
    onMutate: ({ client, variables }) => {
      client.setQueryData<Preferences>(
        'wallet/getPreferences',
        (preferences) => ({ ...preferences, ...variables })
      );
    },
  });
  const globalPreferenesMutation = useOptimisticMutation(setGlobalPreferences, {
    relatedQueryKey: 'wallet/getGlobalPreferences',
    onMutate: ({ client, variables }) =>
      client.setQueryData<GlobalPreferences>(
        'wallet/getGlobalPreferences',
        (globalPreferences) => ({ ...globalPreferences, ...variables })
      ),
  });

  const isMetaMask = useMemo(
    () => preferences?.walletNameFlags?.includes(WalletNameFlag.isMetaMask),
    [preferences?.walletNameFlags]
  );
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={24}>
        <VStack gap={8}>
          <UIText kind="body/regular">Advanced Settings</UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                component: (
                  <HStack gap={4} justifyContent="space-between">
                    <Media
                      image={null}
                      text={<UIText kind="body/regular">MetaMask Mode</UIText>}
                      vGap={4}
                      detailText={
                        <UIText kind="body/regular" color="var(--neutral-500)">
                          Some DApps only work with MetaMask. Zerion Wallet can
                          work with them by appearing as MetaMask
                        </UIText>
                      }
                    />
                    <Toggle
                      checked={isMetaMask}
                      onChange={(event) => {
                        setWalletNameFlag({
                          flag: WalletNameFlag.isMetaMask,
                          checked: event.target.checked,
                        });
                      }}
                    />
                  </HStack>
                ),
              },
              {
                key: 1,
                component: (
                  <HStack gap={4} justifyContent="space-between">
                    <Media
                      image={null}
                      text={
                        <UIText kind="body/regular">
                          Show DApp Network Switch in Header
                        </UIText>
                      }
                      vGap={4}
                      detailText={
                        <UIText kind="body/regular" color="var(--neutral-500)">
                          For a cleaner UI, try turning this off
                        </UIText>
                      }
                    />
                    <Toggle
                      checked={preferences?.showNetworkSwitchShortcut ?? false}
                      onChange={(event) => {
                        preferencesMutation.mutate({
                          showNetworkSwitchShortcut: event.target.checked,
                        });
                      }}
                    />
                  </HStack>
                ),
              },
            ]}
          />
        </VStack>
        <VStack gap={8}>
          <UIText kind="body/regular">More</UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                component: (
                  <HStack gap={4} justifyContent="space-between">
                    <Media
                      image={null}
                      text={
                        <UIText kind="body/regular">
                          Recognizable Connect Buttons
                        </UIText>
                      }
                      vGap={4}
                      detailText={
                        <UIText kind="body/regular" color="var(--neutral-500)">
                          When enabled, we add Zerion Wallet label to connect
                          buttons in DApps so that they{apostrophe}re easier to
                          spot
                        </UIText>
                      }
                    />
                    <Toggle
                      checked={
                        globalPreferences?.recognizableConnectButtons || false
                      }
                      onChange={(event) => {
                        globalPreferenesMutation.mutate({
                          recognizableConnectButtons: event.target.checked,
                        });
                      }}
                    />
                  </HStack>
                ),
              },
            ]}
          />
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function Settings() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <SettingsMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/user-preferences"
        element={
          <ViewSuspense>
            <UserPreferences />
          </ViewSuspense>
        }
      />
      <Route
        path="/appearance"
        element={
          <ViewSuspense>
            <AppearancePage />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
