import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { WalletSelectButton } from 'src/ui/components/WalletSelectButton';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { AddressBackground } from './AddressBackground';
import { AddressDetails } from './AddressDetails';
import { useReceiveSurfaceVariables } from './surface';
import * as styles from './styles.module.css';

/**
 * `/wallet-select` switches the current address globally and drops this key on
 * the way back, so the page picks up the newly-selected wallet through the
 * fallback below instead of returning to the one it was opened for.
 */
const CLEARED_ON_WALLET_CHANGE = ['address'] as const;

export function Receive() {
  useBackgroundKind({ kind: 'transparent' });
  const [params] = useSearchParams();
  const { singleAddress } = useAddressParams();
  const address = params.get('address') || singleAddress;
  invariant(address, 'address param is required');

  const { data: localWallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', address],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', { address, groupId: null }),
    suspense: false,
  });

  const surfaceVariables = useReceiveSurfaceVariables();

  return (
    <div className={styles.surface} style={surfaceVariables}>
      <AddressBackground address={address} />
      <NavigationTitle
        title="Receive"
        elementEnd={
          <WalletSelectButton
            address={address}
            clearSearchParams={CLEARED_ON_WALLET_CHANGE}
          />
        }
      />
      <PageColumn>
        {/* The poster is vertically centred in whatever the popup leaves over,
            rather than pinned below the URL bar: on a short window it keeps its
            spacing and scrolls, on a tall one it doesn't sit top-heavy. */}
        <Spacer height={16} />
        <div style={{ marginBlock: 'auto' }}>
          <AddressDetails address={address} walletName={localWallet?.name} />
        </div>
        <PageBottom />
      </PageColumn>
    </div>
  );
}
