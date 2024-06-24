import React, { useMemo } from 'react';
import { PageTop } from 'src/ui/components/PageTop';
import type { Asset } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import type { Chain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { useCurrency } from 'src/modules/currency/useCurrency';
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

  const { value: positionsResponse, isLoading: arePositionsLoading } =
    useAddressPositions(
      {
        address,
        assets: asset ? [asset?.asset_code] : [],
        currency,
      },
      { enabled: Boolean(asset) }
    );

  const positionQuantity = useMemo(
    () =>
      positionsResponse?.positions.find(
        (position) => position.chain === chain.toString() && !position.dapp?.id
      )?.quantity,
    [chain, positionsResponse?.positions]
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

  if (arePositionsLoading || !asset) {
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
