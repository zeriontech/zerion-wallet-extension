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
import type { ContractMetadata } from 'src/shared/types/Quote';
import type { BridgeFormState } from '../shared/types';

export function SuccessState({
  formState,
  spendPosition,
  receivePosition,
  hash,
  explorer,
  onDone,
  gasbackValue,
}: {
  formState: BridgeFormState;
  spendPosition: BareAddressPosition;
  receivePosition: BareAddressPosition;
  hash: string;
  explorer: ContractMetadata['explorer'] | null;
  gasbackValue: number | null;
  onDone: () => void;
}) {
  const { networks } = useNetworks();

  const { spendInput, spendChainInput, receiveInput, receiveChainInput } =
    formState;

  invariant(
    spendChainInput && receiveChainInput && spendInput && receiveInput,
    'Required form values are missing'
  );

  const actionStatus = useActionStatusByHash(hash);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';

  if (!networks) {
    return <ViewLoading />;
  }

  const spendChain = createChain(spendChainInput);
  const spendChainName = networks.getChainName(spendChain);
  const spendChainIconUrl = networks.getNetworkByName(spendChain)?.icon_url;

  const receiveChain = createChain(receiveChainInput);
  const receiveChainName = networks.getChainName(receiveChain);
  const receiveChainIconUrl = networks.getNetworkByName(receiveChain)?.icon_url;

  const explorerFallbackUrl = hash
    ? networks.getExplorerTxUrlByName(spendChain, hash)
    : undefined;
  const explorerUrl = explorer?.tx_url.replace('{HASH}', hash);

  return (
    <>
      <NavigationTitle urlBar="none" title="Bridge Success" />
      <SuccessStateLoader
        startItem={
          <SuccessStateToken
            iconUrl={spendPosition.asset.icon_url}
            symbol={spendPosition.asset.symbol}
            chainName={spendChainName}
            chainIconUrl={spendChainIconUrl}
          />
        }
        endItem={
          <SuccessStateToken
            iconUrl={receivePosition.asset.icon_url}
            symbol={receivePosition.asset.symbol}
            chainName={receiveChainName}
            chainIconUrl={receiveChainIconUrl}
          />
        }
        status={actionStatus}
        pendingTitle="Transferring"
        failedTitle="Transfer failed"
        dropppedTitle="Transfer cancelled"
        explorerUrl={explorerUrl ?? explorerFallbackUrl}
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
