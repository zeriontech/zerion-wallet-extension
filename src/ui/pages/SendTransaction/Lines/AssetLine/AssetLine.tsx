import React from 'react';
import type { Asset } from 'defi-sdk';
import { DataStatus } from 'defi-sdk';
import { useAssetFromCacheOrAPI } from 'src/modules/defi-sdk/queries';
import type { TransactionDescription as TransactionDescriptionType } from 'src/modules/ethereum/transactions/describeTransaction';
import { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';
import type { Networks } from 'src/modules/networks/Networks';
import type { Chain } from 'src/modules/networks/Chain';
import { TokenAddressLine } from '../TokenAddressLine';
import { TokenSymbolLine } from '../TokenSymbolLine';
import { AmountLine } from '../AmountLine';
import { ItemSurface } from '../../ItemSurface';

function hasTokenAction(action: TransactionAction): boolean {
  return (
    action === TransactionAction.transfer ||
    action === TransactionAction.send ||
    action === TransactionAction.approve ||
    action === TransactionAction.setApprovalForAll ||
    action === TransactionAction.supply ||
    action === TransactionAction.withdraw ||
    action === TransactionAction.stake ||
    action === TransactionAction.unstake
  );
}

function hasAmountAction(action: TransactionAction): boolean {
  return (
    action === TransactionAction.transfer ||
    action === TransactionAction.send ||
    action === TransactionAction.approve ||
    action === TransactionAction.supply ||
    action === TransactionAction.deposit ||
    action === TransactionAction.withdraw ||
    action === TransactionAction.stake ||
    action === TransactionAction.unstake
  );
}

export function AssetLine({
  nativeAsset,
  transaction,
  networks,
  chain,
}: {
  nativeAsset?: Asset;
  transaction: TransactionDescriptionType;
  networks: Networks;
  chain: Chain;
}) {
  const assetCode =
    transaction.sendAssetId ||
    transaction.approveAssetCode ||
    transaction.supplyAssetCode ||
    transaction.withdrawAssetCode ||
    transaction.sendAssetCode;
  const amount =
    transaction.sendAmount ||
    transaction.depositAmount ||
    transaction.withdrawAmount ||
    transaction.supplyAmount ||
    transaction.stakeAmount;
  const { asset, status } = useAssetFromCacheOrAPI({
    address: assetCode || '',
    isNative: false,
  });

  if (hasTokenAction(transaction.action)) {
    if (status === DataStatus.ok && !asset && assetCode) {
      return (
        <TokenAddressLine
          address={assetCode}
          networks={networks}
          chain={chain}
        />
      );
    }

    if (asset) {
      return (
        <TokenSymbolLine asset={asset} chain={chain} networks={networks} />
      );
    }
  }

  if (!asset) {
    return status === DataStatus.requested ? (
      <ItemSurface style={{ height: 56 }} />
    ) : null;
  }

  if (hasAmountAction(transaction.action) && amount && (asset || nativeAsset)) {
    return (
      <AmountLine asset={asset || nativeAsset} amount={amount} chain={chain} />
    );
  }

  return null;
}
