import { useQuery } from 'react-query';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { EIP1559GasPrices } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { gasChainPricesSubscription } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { GasPriceObject } from 'src/modules/ethereum/transactions/gasPrices/GasPriceObject';
import { getNetworkFeeEstimation } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import { useEffect, useMemo } from 'react';
import type { EIP1559 } from 'src/modules/ethereum/transactions/gasPrices/EIP1559';
import { isTruthy } from 'is-truthy-ts';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { ethers } from 'ethers';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';

function getGasPriceFromTransaction(
  transaction: IncomingTransaction
): GasPriceObject | null {
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = transaction;
  if (gasPrice) {
    return { classic: Number(gasPrice) };
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

export function useTransactionFee({
  transaction,
  chain,
  onFeeValueCommonReady,
}: {
  transaction: IncomingTransaction;
  chain: Chain;
  onFeeValueCommonReady: (value: string) => void;
}) {
  const gas = getGas(transaction);
  if (!gas || ethers.BigNumber.from(gas).isZero()) {
    throw new Error('gas field is expected to be found on Transaction object');
  }
  const { value: nativeAsset, isLoading: isLoadingNativeAsset } =
    useNativeAsset(chain);

  const { data: chainGasPrices } = useQuery(
    ['defi-sdk/gasPrices', chain.toString()],
    async () => {
      const gasPrices = await gasChainPricesSubscription.get();
      const chainGasPrices = gasPrices[chain.toString()];
      return chainGasPrices;
    },
    { useErrorBoundary: true }
  );

  const { data, isLoading, isSuccess } = useQuery(
    ['feeEstimation', chain, transaction],
    async () => {
      const gasPrices = await gasChainPricesSubscription.get();
      const chainGasPrices = gasPrices[chain.toString()];

      const gasPriceFromTransaction = getGasPriceFromTransaction(transaction);
      const gasPrice = gasPriceFromTransaction || {
        classic: chainGasPrices.info.classic?.fast,
        eip1559: chainGasPrices.info.eip1559?.fast,
      };
      const feeEstimation = await getNetworkFeeEstimation({
        transaction,
        address: transaction.from || null,
        gas: Number(gas),
        gasPrices: chainGasPrices,
        gasPrice,
      });
      return { feeEstimation, gasPrice };
    }
  );
  const feeEstimation = data?.feeEstimation;
  const noFeeData = isSuccess && !feeEstimation;
  const transactionGasPrice = data?.gasPrice;

  const time = useMemo(() => {
    if (transactionGasPrice?.eip1559 && chainGasPrices?.info.eip1559) {
      // backend API only has time estimation for eip1559 info
      const findMatchingEip1559 = (
        eip1559GasPrices: EIP1559GasPrices,
        eip1559: EIP1559
      ) => {
        const isMatch = (value1: EIP1559, value2: EIP1559) =>
          value1.max_fee === value2.max_fee &&
          value1.priority_fee === value2.priority_fee;
        const { rapid, fast, standard, slow } = eip1559GasPrices;
        return [rapid, fast, standard, slow]
          .filter(isTruthy)
          .find((eip1559Info) => isMatch(eip1559Info, eip1559));
      };
      const eip1559Info = findMatchingEip1559(
        chainGasPrices.info.eip1559,
        transactionGasPrice.eip1559
      );
      const seconds = eip1559Info?.estimation_seconds;
      if (seconds) {
        return `~${formatSeconds(seconds)}`;
      }
    }
  }, [chainGasPrices?.info.eip1559, transactionGasPrice]);

  const { feeValueFiat, feeValueCommon, totalValueCommon, totalValueFiat } =
    useMemo(() => {
      if (!nativeAsset || !feeEstimation) {
        return {};
      }
      const txValue = ethers.BigNumber.from(String(transaction.value ?? 0));
      const decimals = getDecimals({ asset: nativeAsset, chain });
      const feeValueCommon = baseToCommon(feeEstimation.value, decimals);
      const txValueCommon = baseToCommon(txValue.toString(), decimals);
      const totalValue = txValue.add(
        typeof feeEstimation.value === 'number'
          ? String(feeEstimation.value)
          : feeEstimation.value.toFixed()
      );
      const totalValueCommon = baseToCommon(totalValue.toString(), decimals);
      const { price } = nativeAsset;
      return {
        feeValueCommon,
        feeValueFiat:
          price?.value != null ? feeValueCommon.times(price.value) : null,
        txValueCommon,
        totalValueCommon,
        totalValueFiat:
          price?.value != null ? totalValueCommon.times(price.value) : null,
      };
    }, [chain, feeEstimation, nativeAsset, transaction.value]);

  useEffect(() => {
    if (feeValueCommon) {
      onFeeValueCommonReady?.(feeValueCommon.toString());
    }
  }, [feeValueCommon, onFeeValueCommonReady]);

  return {
    time,
    feeValueFiat,
    feeEstimation,
    feeValueCommon,
    totalValueFiat,
    totalValueCommon,
    nativeAsset,
    isLoading,
    isLoadingNativeAsset,
    noFeeData,
  };
}

export type TransactionFee = ReturnType<typeof useTransactionFee>;
