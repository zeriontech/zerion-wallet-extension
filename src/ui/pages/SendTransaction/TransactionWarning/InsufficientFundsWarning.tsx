import React, { useMemo } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NetworkId } from 'src/modules/networks/NetworkId';
import BigNumber from 'bignumber.js';
import { useEvmAddressPositions } from 'src/ui/shared/requests/useEvmAddressPositions';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';

export function useInsufficientFundsWarning({
  address,
  transaction,
  chain,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain | null;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  const transactionFee = useTransactionFee({
    transaction,
    chain: chain || createChain(NetworkId.Ethereum),
    networkFeeConfiguration,
  });

  const { data: addressPositions } = useEvmAddressPositions({
    address,
    chain: chain || createChain(NetworkId.Ethereum),
  });

  const nativeTokenBalance = useMemo(
    () => new BigNumber(addressPositions?.[0].quantity || 0),
    [addressPositions]
  );

  if (!chain) {
    return false;
  }
  return nativeTokenBalance.lt(transactionFee.costs?.totalValueCommon || 0);
}

export function InsufficientFundsWarning({ chain }: { chain: Chain }) {
  const { networks } = useNetworks();

  if (!networks) {
    return null;
  }

  return (
    <VStack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid var(--notice-500)',
      }}
    >
      <HStack gap={8} alignItems="center">
        <WarningIcon size={24} glow={true} outlineStrokeWidth={4} />
        <UIText kind="body/accent" color="var(--notice-600)">
          Insufficient balance
        </UIText>
      </HStack>
      <UIText
        kind="small/regular"
        color="var(--notice-600)"
      >{`You don't have enough ${
        networks?.getNetworkByName(chain)?.native_asset?.symbol.toUpperCase() ||
        'native asset'
      } to cover network fees`}</UIText>
    </VStack>
  );
}
