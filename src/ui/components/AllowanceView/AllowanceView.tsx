import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { invariant } from 'src/shared/invariant';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { createChain } from 'src/modules/networks/Chain';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { AllowanceForm } from '../AllowanceForm';
import { NavigationBar } from '../NavigationBar';

export function AllowanceView({
  address,
  network,
  assetId,
  value,
  requestedAllowanceQuantityBase,
  onChange,
  addressAction,
}: {
  address: string;
  network: NetworkConfig;
  assetId?: string | null;
  value: string;
  requestedAllowanceQuantityBase: string | null;
  onChange: (value: string) => void;
  addressAction: AnyAddressAction | null;
}) {
  const { currency } = useCurrency();
  invariant(
    requestedAllowanceQuantityBase,
    'requestedAllowanceQuantityBase is required to set custom allowance'
  );

  const assetIds = assetId ? [assetId] : [];
  const { data, isLoading: positionsAreLoading } = useHttpAddressPositions(
    { addresses: [address], currency, assetIds },
    { source: useHttpClientSource() },
    {
      enabled: Boolean(assetId),
      refetchInterval: usePositionsRefetchInterval(10000),
    }
  );
  const positions = data?.data;

  const position = useMemo(
    () =>
      positions?.find(
        (position) => position.chain === network.id && !position.dapp?.id
      ),
    [network.id, positions]
  );

  const chain = createChain(network.id);

  const balance = useMemo(() => {
    return position?.quantity
      ? getCommonQuantity({
          asset: position.asset,
          chain,
          baseQuantity: position?.quantity,
        })
      : null;
  }, [chain, position]);

  if (positionsAreLoading || !position?.asset) {
    return <ViewLoading kind="network" />;
  }

  return (
    <>
      <NavigationBar title="Edit allowance" />
      <PageTop />
      <AllowanceForm
        asset={position?.asset}
        chain={chain}
        address={address}
        balance={balance}
        requestedAllowanceQuantityBase={
          new BigNumber(requestedAllowanceQuantityBase)
        }
        value={new BigNumber(value || requestedAllowanceQuantityBase)}
        onSubmit={onChange}
        footerRenderArea="sign-transaction-footer"
        addressAction={addressAction}
      />
    </>
  );
}
