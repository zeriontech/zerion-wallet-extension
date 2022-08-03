import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BackupFlowSettingsSection } from '../BackupWallet/BackupSettingsItem';
import { CurrentNetworkSettingsItem } from '../Networks/CurrentNetworkSettingsItem';

export function Settings() {
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
              component: <div>Manage Wallets</div>,
              to: '/wallets',
            },
            {
              key: 2,
              component: <CurrentNetworkSettingsItem />,
              to: '/networks',
            },
            {
              key: 3,
              onClick: async () => {
                await logout.mutateAsync();
                navigate('/login');
              },
              component: (
                <span style={{ color: 'var(--negative-500)' }}>
                  {logout.isLoading ? 'Locking...' : 'Lock (log out)'}
                </span>
              ),
            },
          ]}
        />
      </VStack>
      <Spacer height={24} />
    </PageColumn>
  );
}
