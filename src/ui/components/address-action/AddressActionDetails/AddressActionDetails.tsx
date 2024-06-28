import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { ActionTransfers, AddressAction } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine } from '../ApplicationLine';
import { Transfers } from '../Transfers';
import { SingleAsset } from '../SingleAsset';

export function AddressActionDetails({
  recipientAddress,
  addressAction,
  chain,
  networks,
  wallet,
  actionTransfers,
  singleAsset,
  allowanceQuantityBase,
  showApplicationLine,
  singleAssetElementEnd,
}: {
  recipientAddress?: string;
  addressAction?: Pick<AnyAddressAction, 'label' | 'type'>;
  chain: Chain;
  networks: Networks;
  wallet: ExternallyOwnedAccount;
  actionTransfers?: ActionTransfers;
  singleAsset?: NonNullable<AddressAction['content']>['single_asset'];
  allowanceQuantityBase: string | null;
  showApplicationLine: boolean;
  singleAssetElementEnd: React.ReactNode;
}) {
  const showRecipientLine =
    recipientAddress && addressAction?.type.value === 'send';

  const applicationLineVisible =
    showApplicationLine && addressAction?.label && !showRecipientLine;

  return (
    <>
      {showRecipientLine ? (
        <RecipientLine
          recipientAddress={recipientAddress}
          chain={chain}
          showNetworkIcon={!applicationLineVisible}
          networks={networks}
        />
      ) : null}
      {applicationLineVisible ? (
        <ApplicationLine
          action={addressAction}
          chain={chain}
          networks={networks}
        />
      ) : null}
      {actionTransfers?.outgoing?.length ||
      actionTransfers?.incoming?.length ? (
        <Transfers
          address={wallet.address}
          chain={chain}
          transfers={actionTransfers}
        />
      ) : null}
      {singleAsset && addressAction ? (
        <SingleAsset
          address={wallet.address}
          chain={chain}
          actionType={addressAction.type.value}
          singleAsset={singleAsset}
          allowanceQuantityBase={allowanceQuantityBase}
          elementEnd={singleAssetElementEnd}
        />
      ) : null}
    </>
  );
}
