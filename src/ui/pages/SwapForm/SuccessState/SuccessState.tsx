import React from 'react';
import type { SwapFormState } from '@zeriontech/transactions';
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
import RetryIcon from 'jsx:src/ui/assets/actions/swap.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { BareAddressPosition } from '../BareAddressPosition';
import { GasbackDecorated } from '../../SendForm/SuccessState/SuccessState';

export function SuccessState({
  swapFormState,
  spendPosition,
  receivePosition,
  hash,
  onRetry,
  onDone,
  gasbackValue,
}: {
  swapFormState: SwapFormState;
  spendPosition: BareAddressPosition;
  receivePosition: BareAddressPosition;
  hash: string;
  gasbackValue: number | null;
  onRetry: () => void;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { chainInput, spendInput, receiveInput } = swapFormState;
  invariant(
    chainInput && spendInput && receiveInput,
    'Required Form values are missing'
  );

  const actionStatus = useActionStatusByHash(hash);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';

  if (!networks) {
    return <ViewLoading />;
  }

  const chain = createChain(chainInput);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getNetworkByName(chain)?.icon_url;

  return (
    <>
      <NavigationTitle urlBar="none" title="Swap Success" />
      <SuccessStateLoader
        startItem={
          <SuccessStateToken
            iconUrl={spendPosition.asset.icon_url}
            symbol={spendPosition.asset.symbol}
            chainName={chainName}
            chainIconUrl={chainIconUrl}
          />
        }
        endItem={
          <SuccessStateToken
            iconUrl={receivePosition.asset.icon_url}
            symbol={receivePosition.asset.symbol}
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
        secondaryAction={
          actionStatus === 'failed' || actionStatus === 'dropped' ? (
            <Button kind="primary" onClick={onRetry}>
              <HStack gap={8} alignItems="center" justifyContent="center">
                <RetryIcon />
                <UIText kind="small/accent">Try Again</UIText>
              </HStack>
            </Button>
          ) : null
        }
        onDone={onDone}
      />
    </>
  );
}
