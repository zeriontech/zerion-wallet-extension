import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
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
import NetworksIcon from 'jsx:src/ui/assets/network.svg';
import SecurityIcon from 'jsx:src/ui/assets/security.svg';
import { version } from 'src/shared/packageVersion';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { apostrophe } from 'src/ui/shared/typography';
import { AppearancePage } from 'src/ui/features/appearance/AppearancePage';
import { usePreferences } from 'src/ui/features/preferences';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SettingsDnaBanners } from 'src/ui/DNA/components/DnaBanners';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BugReportButton } from 'src/ui/components/BugReportButton';
import { BackupFlowSettingsSection } from '../BackupWallet/BackupSettingsItem';
import { Security } from '../Security';

function SettingsMain() {
  const { singleAddressNormalized } = useAddressParams();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => accountPublicRPCPort.request('logout'),
  });
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
                  <HStack gap={8} alignItems="center">
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
                  <HStack gap={8} alignItems="center">
                    <GlobeIcon />
                    <UIText kind="body/regular">Connected Sites</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 3,
              to: '/networks',
              component: (
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <NetworksIcon />
                    <UIText kind="body/regular">Networks</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 4,
              to: '/settings/appearance',
              component: (
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <DarkModeLampIcon />
                    <UIText kind="body/regular">Appearance</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 5,
              to: '/settings/security',
              component: (
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <SecurityIcon />
                    <UIText kind="body/regular">Security</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 6,
              to: '/settings/user-preferences',
              component: (
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <SettingsIcon />
                    <UIText kind="body/regular">Preferences</UIText>
                  </HStack>
                </AngleRightRow>
              ),
            },
            {
              key: 7,
              pad: false,
              style: { paddingInline: 0 },
              component: <BugReportButton />,
            },
            {
              key: 8,
              onClick: async () => {
                await logout.mutateAsync();
                navigate('/login');
              },
              component: (
                <HStack gap={8} alignItems="center">
                  <LockIcon style={{ color: 'var(--negative-500)' }} />
                  <UIText kind="body/regular" color="var(--negative-500)">
                    {logout.isLoading ? 'Locking...' : 'Lock'}
                  </UIText>
                </HStack>
              ),
            },
          ]}
        />
        <SettingsDnaBanners address={singleAddressNormalized} />
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

function ToggleSettingLine({
  checked,
  onChange,
  text,
  detailText,
}: {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  text: NonNullable<React.ReactNode>;
  detailText: React.ReactNode | null;
}) {
  return (
    <HStack gap={4} justifyContent="space-between">
      <Media
        image={null}
        text={<UIText kind="body/accent">{text}</UIText>}
        vGap={4}
        detailText={
          detailText ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {detailText}
            </UIText>
          ) : null
        }
      />
      <Toggle checked={checked} onChange={onChange} />
    </HStack>
  );
}

function UserPreferences() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const { preferences, setPreferences } = usePreferences();

  return (
    <PageColumn>
      <NavigationTitle title="Preferences" />
      <PageTop />
      <VStack gap={8}>
        <UIText kind="body/regular">Advanced Settings</UIText>
        <SurfaceList
          items={[
            {
              key: 0,
              component: (
                <ToggleSettingLine
                  text="Customizable Transaction Nonce"
                  checked={preferences?.configurableNonce ?? false}
                  onChange={(event) => {
                    setPreferences({
                      configurableNonce: event.target.checked,
                    });
                  }}
                  detailText={
                    <span>
                      Set your own unique nonce to control transaction order
                    </span>
                  }
                />
              ),
            },
            {
              key: 1,
              component: (
                <ToggleSettingLine
                  text="Recognizable Connect Buttons"
                  checked={
                    globalPreferences?.recognizableConnectButtons || false
                  }
                  onChange={(event) => {
                    setGlobalPreferences({
                      recognizableConnectButtons: event.target.checked,
                    });
                  }}
                  detailText={
                    <span>
                      When enabled, we add Zerion Wallet label to connect
                      buttons in DApps so that they{apostrophe}re easier to spot
                    </span>
                  }
                />
              ),
            },
            {
              key: 2,
              component: (
                <ToggleSettingLine
                  text="Enable Testnets"
                  checked={preferences?.enableTestnets || false}
                  onChange={(event) => {
                    setPreferences({
                      enableTestnets: event.target.checked,
                    });
                  }}
                  detailText="Enables viewing and interacting with test networks"
                />
              ),
            },
          ]}
        />
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
      <Route
        path="/security/*"
        element={
          <ViewSuspense>
            <Security />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
