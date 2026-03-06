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
import type { ContractMetadata2 } from 'src/shared/types/Quote';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner/CircleSpinner';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import type { BridgeFormState } from '../types';

export function SuccessState({
  formState,
  inputPosition,
  outputPosition,
  hash,
  explorer,
  onDone,
  gasbackValue,
  approveHash,
  needsManualSign,
}: {
  formState: BridgeFormState;
  inputPosition: BareAddressPosition;
  outputPosition: BareAddressPosition;
  hash: string | null;
  explorer: ContractMetadata2['explorer'] | null;
  gasbackValue: number | null;
  onDone: () => void;
  approveHash?: string | null;
  needsManualSign: boolean;
}) {
  const { networks } = useNetworks();

  const { inputAmount, inputChain, outputChain } = formState;

  invariant(
    inputChain && outputChain && inputAmount,
    'Required form values are missing'
  );

  const actionStatus = useActionStatusByHash(hash);
  const approveStatus = useActionStatusByHash(approveHash || null);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';

  if (!networks) {
    return <ViewLoading />;
  }

  const spendChain = createChain(inputChain);
  const spendChainName = networks.getChainName(spendChain);
  const spendChainIconUrl = networks.getByNetworkId(spendChain)?.icon_url;

  const receiveChain = createChain(outputChain);
  const receiveChainName = networks.getChainName(receiveChain);
  const receiveChainIconUrl = networks.getByNetworkId(receiveChain)?.icon_url;

  const explorerFallbackUrl = hash
    ? networks.getExplorerTxUrlByName(spendChain, hash)
    : approveHash
    ? networks.getExplorerTxUrlByName(spendChain, approveHash)
    : undefined;
  const explorerUrl = hash
    ? explorer?.txUrl.replace('{HASH}', hash)
    : undefined;

  return (
    <>
      <NavigationTitle urlBar="none" title="Bridge Success" />
      <SuccessStateLoader
        startItem={
          approveHash || (needsManualSign && !hash) ? (
            <div style={{ position: 'relative' }}>
              <CircleSpinner size="72px" />
              {spendChain ? (
                <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <NetworkIcon
                    size={32}
                    style={{
                      borderRadius: 8,
                      border: '2px solid var(--white)',
                    }}
                    name={spendChainName}
                    src={spendChainIconUrl}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <SuccessStateToken
              iconUrl={inputPosition.asset.icon_url}
              symbol={inputPosition.asset.symbol}
              chainName={spendChainName}
              chainIconUrl={spendChainIconUrl}
            />
          )
        }
        endItem={
          approveHash || (needsManualSign && !hash) ? null : (
            <SuccessStateToken
              iconUrl={outputPosition.asset.icon_url}
              symbol={outputPosition.asset.symbol}
              chainName={receiveChainName}
              chainIconUrl={receiveChainIconUrl}
            />
          )
        }
        status={
          approveHash
            ? approveStatus === 'failed' || approveStatus === 'dropped'
              ? approveStatus
              : 'pending'
            : actionStatus
        }
        pendingTitle={
          approveHash
            ? 'Approving'
            : !hash && needsManualSign
            ? 'Approved'
            : 'Transferring'
        }
        failedTitle="Transfer failed"
        dropppedTitle="Transfer cancelled"
        explorerUrl={explorerUrl ?? explorerFallbackUrl}
        confirmedContent={
          gasbackValue && FEATURE_GASBACK ? (
            <GasbackDecorated value={gasbackValue} />
          ) : null
        }
        onDone={hash ? onDone : undefined}
      />
    </>
  );
}
