import React, { useMemo } from 'react';
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
import { ControlledToggle } from 'src/ui/ui-kit/Toggle/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import WalletIcon from 'jsx:src/ui/assets/wallet.svg';
import LockIcon from 'jsx:src/ui/assets/lock.svg';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
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
                    <UIText kind="body/s_reg">Manage Wallets</UIText>
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
                    <UIText kind="body/s_reg">Connected Sites</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 3,
              to: '/settings/user-preferences',
              component: (
                <AngleRightRow>
                  <HStack gap={4} alignItems="center">
                    <SettingsIcon />
                    <UIText kind="body/s_reg">Preferences</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 4,
              onClick: async () => {
                await logout.mutateAsync();
                navigate('/login');
              },
              component: (
                <HStack
                  gap={8}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack gap={4} alignItems="center">
                    <LockIcon style={{ color: 'var(--negative-500)' }} />
                    <UIText kind="body/s_reg" color="var(--negative-500)">
                      {logout.isLoading ? 'Locking...' : 'Lock'}
                    </UIText>
                  </HStack>
                  <UIText kind="body/s_reg" color="var(--neutral-500)">
                    Log Out
                  </UIText>
                </HStack>
              ),
            },
          ]}
        />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

type Preferences = WalletRecord['preferences'];

function usePreferencesMutation<Args, Res>(
  mutationFn: (...args: Args[]) => Promise<Res>
) {
  type OptimisticContext = { previous?: Preferences };
  const client = useQueryClient();
  return useMutation(mutationFn, {
    onMutate: async (): Promise<OptimisticContext> => {
      await client.cancelQueries('wallet/getPreferences');
      const previous = client.getQueryData<Preferences | undefined>(
        'wallet/getPreferences'
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      client.setQueryData('wallet/getPreferences', context?.previous);
    },
    onSettled: () => client.invalidateQueries('wallet/getPreferences'),
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
async function setPreference(preferences: Preferences) {
  walletPort.request('setPreference', { preferences });
}

function UserPreferences() {
  const { data: preferences } = useQuery(
    'wallet/getPreferences',
    () => walletPort.request('getPreferences'),
    { useErrorBoundary: true, suspense: true }
  );
  const { mutate: setWalletNameFlag } = usePreferencesMutation(
    walletSetWalletNameFlag
  );
  const preferencesMutation = usePreferencesMutation(setPreference);
  const isMetaMask = useMemo(
    () => preferences?.walletNameFlags?.includes(WalletNameFlag.isMetaMask),
    [preferences?.walletNameFlags]
  );
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={24}>
        <VStack gap={8}>
          <UIText kind="body/s_reg">Advanced Settings</UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                component: (
                  <HStack gap={4} justifyContent="space-between">
                    <Media
                      image={null}
                      text={<UIText kind="body/s_reg">MetaMask Mode</UIText>}
                      vGap={0}
                      detailText={
                        <UIText kind="body/s_reg" color="var(--neutral-500)">
                          Some DApps only work with MetaMask. Zerion Wallet can
                          work with them by appearing as MetaMask
                        </UIText>
                      }
                    />
                    <ControlledToggle
                      value={isMetaMask}
                      onChange={(checked) => {
                        setWalletNameFlag({
                          flag: WalletNameFlag.isMetaMask,
                          checked,
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
                        <UIText kind="body/s_reg">
                          Show DApp Network Switch in Header
                        </UIText>
                      }
                      vGap={0}
                      detailText={
                        <UIText kind="body/s_reg" color="var(--neutral-500)">
                          For a cleaner UI, try turning this off
                        </UIText>
                      }
                    />
                    <ControlledToggle
                      value={preferences?.showNetworkSwitchShortcut}
                      onChange={(checked) => {
                        preferencesMutation.mutate({
                          showNetworkSwitchShortcut: checked,
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
    </Routes>
  );
}
