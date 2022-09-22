import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { getNetworkFeeEstimation } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import type { GasPriceObject } from 'src/modules/ethereum/transactions/gasPrices/GasPriceObject';
import {
  ChainGasPrice,
  gasChainPricesSubscription,
} from 'src/modules/ethereum/transactions/gasPrices/requests';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { getDecimals } from 'src/modules/networks/asset';
import { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

function getGasPriceFromTransaction(
  transaction: IncomingTransaction
): GasPriceObject | null {
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = transaction;
  const estimatedGas = getGas(transaction);
  if (estimatedGas && gasPrice) {
    return {
      classic: Number(gasPrice),
    };
  }
  if (maxPriorityFeePerGas && maxFeePerGas) {
    return {
      eip1559: {
        priority_fee: Number(maxPriorityFeePerGas),
        max_fee: Number(maxFeePerGas),
      },
    };
  }
  return null;
}

function getFeeTypeTitle(type: keyof ChainGasPrice['info'] | undefined) {
  if (!type) {
    return undefined;
  }
  if (type === 'classic') {
    return undefined;
  }
  const labels = { eip1559: 'EIP-1559', optimistic: 'Optimistic' } as const;
  return labels[type];
}

export function NetworkFee({
  transaction,
  chain,
}: {
  transaction: IncomingTransaction;
  chain: Chain;
}) {
  const gas = getGas(transaction);
  if (!gas) {
    throw new Error('gas field is expected to be found on Transaction object');
  }
  const { value: nativeAsset } = useNativeAsset(chain);

  const { data: feeEstimation, isLoading } = useQuery(
    ['feeEstimation', chain, transaction],
    async () => {
      const gasPrices = await gasChainPricesSubscription.get();
      const chainGasPrices = gasPrices[chain.toString()];

      return getNetworkFeeEstimation({
        transaction,
        address: transaction.from || null,
        gas: Number(gas),
        gasPrices: chainGasPrices,
        gasPrice: getGasPriceFromTransaction(transaction) || {
          classic: chainGasPrices.info.classic?.fast,
          eip1559: chainGasPrices.info.eip1559?.fast,
        },
      });
    }
  );

  const fiatValue = useMemo(() => {
    if (!nativeAsset || !feeEstimation) {
      return;
    }
    const commonQuantity = baseToCommon(
      feeEstimation.value,
      getDecimals({ asset: nativeAsset, chain })
    );
    const { price } = nativeAsset;
    if (!price) {
      return null;
    }
    return commonQuantity.times(price.value);
  }, [chain, feeEstimation, nativeAsset]);
  return (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <UIText kind="body/s_reg">Network Fee</UIText>
      {isLoading ? (
        <CircleSpinner />
      ) : fiatValue == null ? null : (
        <UIText kind="body/s_reg" title={getFeeTypeTitle(feeEstimation?.type)}>
          {formatCurrencyValue(fiatValue, 'en', 'usd')}
        </UIText>
      )}
    </HStack>
  );
}
