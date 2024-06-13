import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { invariant } from 'src/shared/invariant';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { windowPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function TestnetModeGuard() {
  const [params] = useSearchParams();
  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');
  const targetNetwork = params.get('targetNetwork');
  invariant(targetNetwork, 'targetNetwork get-parameter is required');
  const network = useMemo(
    () => JSON.parse(targetNetwork) as NetworkConfig,
    [targetNetwork]
  );

  const handleConfirm = () => windowPort.confirm(windowId, {});
  const handleReject = () => windowPort.reject(windowId);

  return (
    <PageColumn>
      <div
        style={{ display: 'grid', gridTemplateRows: '1fr auto', flexGrow: 1 }}
      >
        <VStack
          gap={16}
          style={{
            placeSelf: 'center',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <NetworkIcon size={36} name={network.name} src={network.icon_url} />
          <UIText kind="headline/h3">Switching to {network.name}?</UIText>
          <UIText kind="body/regular">
            Testnet mode is currently active. Would you like to disable it and
            interact with Ehereum instead?
          </UIText>
        </VStack>

        <VStack gap={8} style={{ marginTop: 'auto' }}>
          <Button kind="primary" onClick={handleConfirm}>
            Disable and Continue
          </Button>
          <Button kind="regular" onClick={handleReject}>
            Cancel
          </Button>
        </VStack>
      </div>
      <PageBottom />
    </PageColumn>
  );
}
