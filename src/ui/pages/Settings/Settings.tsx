import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BackupFlowSettingsSection } from '../BackupWallet/BackupSettingsItem';
import { CurrentNetworkSettingsItem } from '../Networks/CurrentNetworkSettingsItem';

export function Settings() {
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
            { key: 3, component: <div>Back</div>, to: '/overview' },
          ]}
        />
      </VStack>
      <Spacer height={24} />
    </PageColumn>
  );
}
