import React from 'react';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import type { ActionTransfers, AddressAction } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { VStack } from 'src/ui/ui-kit/VStack';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine } from '../ApplicationLine';
import { Transfers } from '../Transfers';
import { SingleAsset } from '../SingleAsset';

export function AddressActionDetails({
  address,
  recipientAddress,
  addressAction,
  chain,
  networks,
  actionTransfers,
  singleAsset,
  allowanceQuantityBase,
  showApplicationLine,
  singleAssetElementEnd,
}: {
  address: string;
  recipientAddress?: string;
  addressAction?: Pick<AnyAddressAction, 'label' | 'type'>;
  chain: Chain;
  networks: Networks;
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
          address={address}
          chain={chain}
          transfers={actionTransfers}
        />
      ) : null}
      {singleAsset && addressAction ? (
        <SingleAsset
          address={address}
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

/**
 * TODO: Temporary helper, later the whole AddressActionDetails
 * must be refactored to take as few params as possible
 * and to derive as much data as possible from `addressAction`
 */
export function AddressActionComponent({
  address,
  addressAction,
  showApplicationLine,
  vGap = 16,
}: {
  address: string;
  addressAction: AnyAddressAction;
  showApplicationLine: boolean;
  vGap?: number;
}) {
  const recipientAddress = addressAction.label?.display_value.wallet_address;
  const actionTransfers = addressAction.content?.transfers;
  const singleAsset = addressAction.content?.single_asset;
  const { networks } = useNetworks();

  if (!networks) {
    return null;
  }

  return (
    <VStack gap={vGap}>
      <AddressActionDetails
        address={address}
        recipientAddress={recipientAddress}
        addressAction={addressAction}
        chain={createChain(addressAction.transaction.chain)}
        networks={networks}
        actionTransfers={actionTransfers}
        singleAsset={singleAsset}
        allowanceQuantityBase={null}
        showApplicationLine={showApplicationLine}
        singleAssetElementEnd={null}
      />
    </VStack>
  );
}
