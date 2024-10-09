import React, { useMemo } from 'react';
import { PageTop } from 'src/ui/components/PageTop';
import type { Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import type { Chain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { NavigationBar } from '../NavigationBar';
import { AllowanceForm } from '../AllowanceForm';

export function AllowanceView({
  address,
  chain,
  asset,
  value,
  requestedAllowanceQuantityBase,
  onChange,
}: {
  address: string;
  chain: Chain;
  asset?: Asset | null;
  value: string;
  requestedAllowanceQuantityBase?: string;
  onChange: (value: string) => void;
}) {
  const { currency } = useCurrency();
  invariant(
    requestedAllowanceQuantityBase,
    'requestedAllowanceQuantityBase is required to set custom allowance'
  );

  const assetIds = asset ? [asset?.asset_code] : [];
  const { data, isLoading: positionsAreLoading } = useHttpAddressPositions(
    { addresses: [address], currency, assetIds },
    { source: useHttpClientSource() },
    { enabled: Boolean(asset), refetchInterval: 10000 }
  );
  const positions = data?.data;

  const positionQuantity = useMemo(
    () =>
      positions?.find(
        (position) => position.chain === chain.toString() && !position.dapp?.id
      )?.quantity,
    [chain, positions]
  );

  const balance = useMemo(
    () =>
      positionQuantity && asset
        ? getCommonQuantity({
            asset,
            chain,
            baseQuantity: positionQuantity,
          })
        : null,
    [asset, chain, positionQuantity]
  );

  if (positionsAreLoading || !asset) {
    return <ViewLoading kind="network" />;
  }

  return (
    <>
      <NavigationBar title="Edit allowance" />
      <PageTop />
      <AllowanceForm
        asset={asset}
        chain={chain}
        address={address}
        balance={balance}
        requestedAllowanceQuantityBase={
          new BigNumber(requestedAllowanceQuantityBase)
        }
        value={new BigNumber(value || requestedAllowanceQuantityBase)}
        onSubmit={onChange}
        footerRenderArea="sign-transaction-footer"
      />
    </>
  );
}
