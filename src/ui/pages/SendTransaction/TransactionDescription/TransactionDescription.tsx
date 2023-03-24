import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { Networks } from 'src/modules/networks/Networks';
import { Chain } from 'src/modules/networks/Chain';
import {
  TransactionAction,
  TransactionDescription as TransactionDescriptionType,
} from 'src/modules/ethereum/transactions/describeTransaction';
import { useAssetFromCacheOrAPI } from 'src/modules/defi-sdk/queries';

import { AssetLine } from '../Lines/AssetLine';
import { WalletLine } from '../Lines/WalletLine';
import { PayWithLine } from '../Lines/PayWithLine';
import { ContractAddressLine } from '../Lines/ContractAddressLine';

export function TransactionDescription({
  transaction,
  transactionDescription,
  networks,
  chain,
}: {
  transaction: PartiallyRequired<IncomingTransaction, 'chainId'>;
  transactionDescription: TransactionDescriptionType;
  networks: Networks;
  chain: Chain;
}) {
  const { chainId } = transaction;
  const { action, contractAddress, assetReceiver } = transactionDescription;
  const network = networks.getNetworkById(ethers.utils.hexValue(chainId));
  const nativeAssetInfo = network.native_asset;
  const nativeValue = useMemo(
    () => ethers.BigNumber.from(transaction.value ?? 0),
    [transaction.value]
  );
  const { asset: nativeAsset } = useAssetFromCacheOrAPI({
    address: null,
    isNative: true,
    id: nativeAssetInfo?.id ?? null,
    chain: new Chain(network.chain),
  });
  return (
    <>
      <AssetLine
        nativeAsset={nativeAsset || undefined}
        transaction={transactionDescription}
        networks={networks}
        chain={chain}
      />
      {(action === TransactionAction.transfer ||
        action === TransactionAction.send ||
        action === TransactionAction.deposit ||
        action === TransactionAction.withdraw) &&
      assetReceiver ? (
        <WalletLine
          address={assetReceiver}
          label="Recepient"
          networks={networks}
          chain={chain}
        />
      ) : null}
      {(action === TransactionAction.contractInteraction ||
        action === TransactionAction.multicall ||
        action === TransactionAction.supply ||
        action === TransactionAction.withdraw) &&
      contractAddress ? (
        <ContractAddressLine
          address={contractAddress}
          chain={chain}
          networks={networks}
        />
      ) : null}
      {nativeAsset &&
      !transactionDescription.isNativeSend &&
      !nativeValue.isZero() ? (
        <PayWithLine
          asset={nativeAsset}
          value={nativeValue.toString()}
          chain={chain}
        />
      ) : null}
    </>
  );
}
