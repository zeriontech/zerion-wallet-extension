import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
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
              component: <UIText kind="body/s_reg">Manage Wallets</UIText>,
              to: '/wallets',
            },
            {
              key: 1,
              component: <CurrentNetworkSettingsItem />,
              to: '/networks',
            },
            {
              key: 2,
              component: <UIText kind="body/s_reg">Connected Sites</UIText>,
              to: '/connected-sites',
            },
            {
              key: 3,
              onClick: async () => {
                await logout.mutateAsync();
                navigate('/login');
              },
              component: (
                <UIText kind="body/s_reg" color="var(--negative-500)">
                  {logout.isLoading ? 'Locking...' : 'Lock (log out)'}
                </UIText>
              ),
            },
          ]}
        />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
