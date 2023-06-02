import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { isTruthy } from 'is-truthy-ts';
import { ethers } from 'ethers';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type {
  ChainGasPrice,
  EIP1559GasPrices,
} from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { GasPriceObject } from 'src/modules/ethereum/transactions/gasPrices/GasPriceObject';
import type { EstimatedFeeValue } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import { getNetworkFeeEstimation } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import type { EIP1559 } from 'src/modules/ethereum/transactions/gasPrices/EIP1559';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';

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

function getGasPriceFromConfiguration({
  chainGasPrices,
  configuration,
}: {
  chainGasPrices?: ChainGasPrice | null;
  configuration?: NetworkFeeConfiguration;
}): GasPriceObject | null {
  if (!configuration) {
    return null;
  }
  if (
    configuration.speed === 'custom' &&
    (configuration.custom1559GasPrice || configuration.customClassicGasPrice)
  ) {
    return {
      classic: configuration.customClassicGasPrice,
      eip1559: configuration.custom1559GasPrice,
    };
  }
  if (!chainGasPrices) {
    return null;
  }
  const speed = configuration.speed === 'custom' ? 'fast' : configuration.speed;
  return {
    classic: chainGasPrices.info.classic?.[speed],
    eip1559: chainGasPrices.info.eip1559?.[speed],
  };
}

export function useFeeEstimation(
  chain: Chain,
  transaction: IncomingTransaction,
  networkFeeConfiguration?: NetworkFeeConfiguration
) {
  const gas = getGas(transaction);
  if (!gas || ethers.BigNumber.from(gas).isZero()) {
    throw new Error('gas field is expected to be found on Transaction object');
  }
  const { data: chainGasPrices } = useGasPrices(chain);
  return useQuery(
    ['feeEstimation', chain, transaction, networkFeeConfiguration],
    async () => {
      const gasPriceFromTransaction = getGasPriceFromTransaction(transaction);
      const gasPriceFromConfiguration = getGasPriceFromConfiguration({
        chainGasPrices,
        configuration: networkFeeConfiguration,
      });
      const gasPrice =
        gasPriceFromConfiguration ||
        gasPriceFromTransaction ||
        (chainGasPrices
          ? {
              classic: chainGasPrices.info.classic?.fast,
              eip1559: chainGasPrices.info.eip1559?.fast,
            }
          : null);
      const feeEstimation = await getNetworkFeeEstimation({
        transaction,
        address: transaction.from || null,
        gas: Number(gas),
        gasPrices: chainGasPrices || null,
        gasPrice,
      });
      return { feeEstimation, gasPrice };
    },
    { suspense: false, retry: 0 }
  );
}

export function useTransactionPrices(
  chain: Chain,
  transaction: IncomingTransaction,
  feeEstimation?: EstimatedFeeValue | null
) {
  const { value: nativeAsset, isLoading } = useNativeAsset(chain);
  const { networks } = useNetworks();

  return useMemo(() => {
    if (!feeEstimation) {
      return { isLoading };
    }
    const txValue = ethers.BigNumber.from(String(transaction.value ?? 0));
    const totalValue = txValue.add(
      typeof feeEstimation.value === 'number'
        ? String(feeEstimation.value)
        : feeEstimation.value.toFixed()
    );

    const decimals = nativeAsset
      ? getDecimals({ asset: nativeAsset, chain })
      : networks?.getNetworkByName(chain)?.native_asset?.decimals;

    if (!decimals) {
      return { isLoading };
    }

    const feeValueCommon = baseToCommon(feeEstimation.value, decimals);
    const txValueCommon = baseToCommon(txValue.toString(), decimals);
    const totalValueCommon = baseToCommon(totalValue.toString(), decimals);
    const price = nativeAsset?.price;
    return {
      feeValueCommon,
      feeValueFiat:
        price?.value != null && feeValueCommon
          ? feeValueCommon.times(price.value)
          : null,
      txValueCommon,
      totalValueCommon,
      totalValueFiat:
        price?.value != null && totalValueCommon
          ? totalValueCommon.times(price.value)
          : null,
      isLoading,
      nativeAsset,
    };
  }, [
    chain,
    feeEstimation,
    nativeAsset,
    transaction.value,
    isLoading,
    networks,
  ]);
}

export function useTransactionFee({
  transaction,
  chain,
  onFeeValueCommonReady,
  networkFeeConfiguration,
}: {
  transaction: IncomingTransaction;
  chain: Chain;
  onFeeValueCommonReady: (value: string) => void;
  networkFeeConfiguration?: NetworkFeeConfiguration;
}) {
  const { data: chainGasPrices } = useGasPrices(chain);
  const { data, isLoading, isSuccess } = useFeeEstimation(
    chain,
    transaction,
    networkFeeConfiguration
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

  const {
    feeValueFiat,
    feeValueCommon,
    totalValueCommon,
    totalValueFiat,
    nativeAsset,
    isLoading: isTransactionPricesLoading,
  } = useTransactionPrices(chain, transaction, feeEstimation);

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
    isTransactionPricesLoading,
    noFeeData,
  };
}

export type TransactionFee = ReturnType<typeof useTransactionFee>;
