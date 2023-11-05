import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/arrow-down.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageBottom } from 'src/ui/components/PageBottom';
import { VStack } from 'src/ui/ui-kit/VStack';
import { noValueDash } from 'src/ui/shared/typography';
import { Button } from 'src/ui/ui-kit/Button';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { ValueCell } from '../shared/ValueCell';

export function NetworkUpdateSuccess({
  network,
  oldNetwork,
  onClose,
}: {
  network: NetworkConfig;
  oldNetwork: NetworkConfig;
  onClose: () => void;
}) {
  const networkName = network.name || network.external_id;
  const oldRpcUrl = oldNetwork.rpc_url_user || oldNetwork.rpc_url_public?.[0];

  return (
    <PageColumn>
      <NavigationTitle
        urlBar="none"
        title={null}
        documentTitle="RPC URL updated successfully"
      />
      <Spacer height={64} />
      <CheckIcon
        style={{
          display: 'block',
          marginInline: 'auto',
          width: 62,
          height: 62,
          color: 'var(--primary-500)',
        }}
      />
      <Spacer height={16} />
      <UIText
        kind="headline/h1"
        style={{
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {networkName}
      </UIText>
      <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
        RPC URL updated successfully!
      </UIText>
      <Spacer height={32} />
      <VStack gap={8} style={{ textAlign: 'center' }}>
        <ValueCell label="Old RPC URL" value={oldRpcUrl || noValueDash} />
        <div>
          <ArrowDownIcon
            style={{
              width: 16,
              height: 16,
              color: 'var(--neutral-500)',
            }}
          />
        </div>
        <ValueCell
          label="New RPC URL"
          value={network.rpc_url_public?.[0] || noValueDash}
        />
      </VStack>
      <PageBottom />
      <Button style={{ marginTop: 'auto' }} onClick={onClose}>
        Close
      </Button>
      <PageBottom />
    </PageColumn>
  );
}
