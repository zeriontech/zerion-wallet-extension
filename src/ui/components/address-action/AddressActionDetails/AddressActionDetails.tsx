import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { ActionAsset, ActionTransfers } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine } from '../ApplicationLine';
import { Transfers } from '../Transfers';
import { SingleAsset } from '../SingleAsset';

export function AddressActionDetails({
  recipientAddress,
  addressAction,
  chain,
  networks,
  actionTransfers,
  wallet,
  singleAsset,
}: {
  recipientAddress?: string;
  addressAction?: Pick<AnyAddressAction, 'label' | 'type'>;
  chain: Chain;
  networks: Networks;
  actionTransfers?: ActionTransfers;
  wallet: BareWallet;
  singleAsset?: ActionAsset;
}) {
  return (
    <>
      {recipientAddress && addressAction?.type.value === 'send' ? (
        <RecipientLine
          recipientAddress={recipientAddress}
          chain={chain}
          networks={networks}
        />
      ) : null}
      {addressAction?.label &&
      Boolean(addressAction?.label.display_value.contract_address) ? (
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
          actionType={addressAction.type.value}
          asset={singleAsset}
        />
      ) : null}
    </>
  );
}
