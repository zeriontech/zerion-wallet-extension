import React from 'react';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { SuccessStateLoader } from 'src/ui/shared/forms/SuccessState/SuccessStateLoader';
import { SuccessStateToken } from 'src/ui/shared/forms/SuccessState/SuccessStateToken';
import { useActionStatusByHash } from 'src/ui/shared/forms/SuccessState/useActionStatusByHash';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { GasbackDecorated } from 'src/ui/components/GasbackDecorated';
import type { BareAddressPosition } from 'src/shared/types/BareAddressPosition';
import type { SwapFormState } from '../shared/SwapFormState';

export function SuccessState({
  swapFormState,
  inputPosition,
  outputPosition,
  hash,
  onDone,
  gasbackValue,
}: {
  swapFormState: SwapFormState;
  inputPosition: BareAddressPosition;
  outputPosition: BareAddressPosition;
  hash: string;
  gasbackValue: number | null;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { inputChain } = swapFormState;
  invariant(inputChain, 'Required Form values are missing');

  const actionStatus = useActionStatusByHash(hash);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';

  if (!networks) {
    return <ViewLoading />;
  }

  const chain = createChain(inputChain);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getByNetworkId(chain)?.icon_url;

  return (
    <>
      <NavigationTitle urlBar="none" title="Swap Success" />
      <SuccessStateLoader
        startItem={
          <SuccessStateToken
            iconUrl={inputPosition.asset.icon_url}
            symbol={inputPosition.asset.symbol}
            chainName={chainName}
            chainIconUrl={chainIconUrl}
          />
        }
        endItem={
          <SuccessStateToken
            iconUrl={outputPosition.asset.icon_url}
            symbol={outputPosition.asset.symbol}
            chainName={chainName}
            chainIconUrl={chainIconUrl}
          />
        }
        status={actionStatus}
        pendingTitle="Swapping"
        failedTitle="Swap failed"
        dropppedTitle="Swap cancelled"
        explorerUrl={
          hash ? networks.getExplorerTxUrlByName(chain, hash) : undefined
        }
        confirmedContent={
          gasbackValue && FEATURE_GASBACK ? (
            <GasbackDecorated value={gasbackValue} />
          ) : null
        }
        onDone={onDone}
      />
    </>
  );
}
