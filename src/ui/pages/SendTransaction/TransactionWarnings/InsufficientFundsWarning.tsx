import React from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';

function useInsufficientFundsWarning({
  address,
  transaction,
  chain,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  const transactionFee = useTransactionFee({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
    onFeeValueCommonReady: null,
  });

  return transactionFee.costs?.totalValueExceedsBalance ?? false;
}

export function InsufficientFundsWarning({
  address,
  transaction,
  chain,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  const { networks } = useNetworks();

  const isInsufficientFundsWarning = useInsufficientFundsWarning({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
  });

  if (!networks || !isInsufficientFundsWarning) {
    return null;
  }

  return (
    <>
      <VStack
        gap={8}
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--notice-500)',
        }}
      >
        <HStack gap={8} alignItems="center">
          <ValidationErrorIcon style={{ color: 'var(--notice-600)' }} />
          <UIText kind="body/accent" color="var(--notice-600)">
            Insufficient balance
          </UIText>
        </HStack>
        <UIText
          kind="small/regular"
          color="var(--notice-600)"
        >{`You don't have enough ${
          networks
            ?.getNetworkByName(chain)
            ?.native_asset?.symbol.toUpperCase() || 'native token'
        } to cover network fees`}</UIText>
      </VStack>
      <Spacer height={16} />
    </>
  );
}
