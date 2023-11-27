import { useEffect, useMemo } from 'react';
import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { ethers } from 'ethers';
import { useQuery } from '@tanstack/react-query';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type {
  ChainGasPrice,
  EIP1559GasPrices,
} from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { GasPriceObject } from 'src/modules/ethereum/transactions/gasPrices/GasPriceObject';
import type { EstimatedFeeValue } from 'src/modules/ethereum/transactions/gasPrices/estimateNetworkFee';
import { getNetworkFeeEstimation } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import type { EIP1559 } from 'src/modules/ethereum/transactions/gasPrices/EIP1559';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { useNetworks } from 'src/modules/networks/useNetworks';
import {
  queryGasPrices,
  useGasPrices,
} from 'src/ui/shared/requests/useGasPrices';
import type { Networks } from 'src/modules/networks/Networks';
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
  configuration: NetworkFeeConfiguration | null;
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

function useFeeEstimation(
  chain: Chain,
  transaction: IncomingTransaction,
  /** gas price derived from configuration takes precedence over gas price from transaction */
  networkFeeConfiguration: NetworkFeeConfiguration | null,
  { keepPreviousData = false } = {}
) {
  const gas = getGas(transaction);
  if (!gas || ethers.BigNumber.from(gas).isZero()) {
    throw new Error('gas field is expected to be found on Transaction object');
  }
  return useQuery({
    keepPreviousData,
    suspense: !keepPreviousData,
    queryKey: [
      'feeEstimation',
      chain,
      transaction,
      networkFeeConfiguration,
      gas,
    ],
    queryFn: async () => {
      const chainGasPrices = await queryGasPrices(chain);
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
    retry: 0,
  });
}

function calculateTransactionCosts({
  chain,
  networks,
  transaction,
  nativeAsset,
  estimatedFeeValue,
}: {
  chain: Chain;
  networks: Networks;
  transaction: IncomingTransaction;
  nativeAsset: Asset | null;
  estimatedFeeValue: EstimatedFeeValue;
}) {
  const txValue = ethers.BigNumber.from(String(transaction.value ?? 0));
  const { estimatedFee } = estimatedFeeValue;
  const totalValue = txValue.add(
    typeof estimatedFee === 'number'
      ? String(estimatedFee)
      : estimatedFee.toFixed()
  );

  const decimals = nativeAsset
    ? getDecimals({ asset: nativeAsset, chain })
    : networks?.getNetworkByName(chain)?.native_asset?.decimals;

  if (decimals == null) {
    return null;
  }

  const feeValueCommon = baseToCommon(estimatedFee, decimals);
  const txValueCommon = baseToCommon(txValue.toString(), decimals);
  const totalValueCommon = baseToCommon(totalValue.toString(), decimals);
  const price = nativeAsset?.price?.value;
  return {
    feeValueCommon,
    feeValueFiat: price != null ? feeValueCommon.times(price) : null,
    txValueCommon,
    // TODO: add txValueFiat?
    totalValueCommon,
    totalValueFiat: price != null ? totalValueCommon.times(price) : null,
  };
}

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

function getFeeTime(
  gasPrice: GasPriceObject | null,
  chainGasPrices: ChainGasPrice | null
) {
  if (gasPrice?.eip1559 && chainGasPrices?.info.eip1559) {
    // backend API only has time estimation for eip1559 info
    const eip1559Info = findMatchingEip1559(
      chainGasPrices.info.eip1559,
      gasPrice.eip1559
    );
    const seconds = eip1559Info?.estimation_seconds;
    if (seconds) {
      return `~${formatSeconds(seconds)}`;
    }
  }
}

export function useTransactionFee({
  transaction,
  chain,
  onFeeValueCommonReady,
  networkFeeConfiguration,
  keepPreviousData = false,
}: {
  transaction: IncomingTransaction;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  networkFeeConfiguration: NetworkFeeConfiguration | null;
  keepPreviousData?: boolean;
}) {
  const { data: chainGasPrices } = useGasPrices(chain);
  const feeEstimationQuery = useFeeEstimation(
    chain,
    transaction,
    networkFeeConfiguration,
    { keepPreviousData }
  );

  const feeEstimation = feeEstimationQuery.data?.feeEstimation;
  const transactionGasPrice = feeEstimationQuery.data?.gasPrice;

  const time = useMemo(
    () => getFeeTime(transactionGasPrice || null, chainGasPrices || null),
    [chainGasPrices, transactionGasPrice]
  );

  const { value: nativeAsset, isLoading: isLoadingNativeAsset } =
    useNativeAsset(chain);
  const { networks } = useNetworks();
  const costs = useMemo(
    () =>
      networks && feeEstimation
        ? calculateTransactionCosts({
            chain,
            transaction,
            networks,
            estimatedFeeValue: feeEstimation,
            nativeAsset: nativeAsset || null,
          })
        : null,
    [chain, feeEstimation, nativeAsset, networks, transaction]
  );
  const costsAreLoading =
    !costs &&
    ((!feeEstimation && feeEstimationQuery.isFetching) || isLoadingNativeAsset);

  const feeValueCommon = costs?.feeValueCommon;
  useEffect(() => {
    if (feeValueCommon) {
      onFeeValueCommonReady?.(feeValueCommon.toString());
    }
  }, [feeValueCommon, onFeeValueCommonReady]);

  return {
    time,
    feeEstimation,
    feeEstimationQuery,
    costs,
    costsQuery: { isLoading: costsAreLoading },
    nativeAsset,
  };
}

export type TransactionFee = ReturnType<typeof useTransactionFee>;
