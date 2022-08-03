import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { BackupSettingsItem } from '../BackupWallet/BackupSettingsItem';
import { CurrentNetworkSettingsItem } from '../Networks/CurrentNetworkSettingsItem';

export function Settings() {
  return (
    <PageColumn>
      <PageTop />
      <SurfaceList
        items={[
          {
            key: 0,
            component: <div>Manage Wallets</div>,
            to: '/wallets',
          },
          {
            key: 1,
            component: <BackupSettingsItem />,
            to: '/backup-wallet',
          },
          {
            key: 2,
            component: <CurrentNetworkSettingsItem />,
            to: '/networks',
          },
          { key: 3, component: <div>Back</div>, to: '/overview' },
        ]}
      />
    </PageColumn>
  );
}
