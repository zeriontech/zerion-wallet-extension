import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { ConnectedSiteDialog } from '../../ConnectedSites/ConnectedSite';
import { getConnectionDotState } from './getConnectionDotState';

/**
 * Small green/gray dot shown to the left of the wallet name on Overview.
 * Green = current wallet connected to the active tab; gray = connectable site
 * but not connected. Hidden on non-connectable tabs. Tapping it opens the
 * connection menu (which also hosts the dapp chain switcher).
 */
export function ConnectionDot() {
  const { singleAddressNormalized: address } = useAddressParams();
  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const { data: isConnected } = useIsConnectedToActiveTab(address);
  const [showDialog, setShowDialog] = useState(false);

  const { visible, color } = getConnectionDotState({
    url: tabData?.url,
    isConnected,
  });
  const activeTabOrigin = tabData?.tabOrigin;

  if (!visible || !activeTabOrigin) {
    return null;
  }
  return (
    <>
      <UnstyledButton
        title="Site connection"
        aria-label="Site connection"
        onClick={() => setShowDialog(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 8,
          paddingRight: 4,
        }}
      >
        <span
          style={{
            display: 'block',
            position: 'relative',
            top: 1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      </UnstyledButton>
      <Dialog2
        open={showDialog}
        onClose={() => setShowDialog(false)}
        size="content"
      >
        <div style={{ paddingInline: 16, paddingBlock: 24 }}>
          <ConnectedSiteDialog
            originName={activeTabOrigin}
            onDismiss={() => setShowDialog(false)}
          />
        </div>
      </Dialog2>
    </>
  );
}
