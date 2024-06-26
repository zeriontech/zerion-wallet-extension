import { useEffect, useMemo } from 'react';
import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { ethers } from 'ethers';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import type {
  EIP1559,
  NetworkFeeConfiguration,
} from '@zeriontech/transactions';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { useNativeAsset } from 'src/ui/shared/requests/useNativeAsset';
import { useNativeBalance } from 'src/ui/shared/requests/useNativeBalance';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { GasPriceObject } from 'src/modules/ethereum/transactions/gasPrices/GasPriceObject';
import type { EstimatedFeeValue } from 'src/modules/ethereum/transactions/gasPrices/estimateNetworkFee';
import { getNetworkFeeEstimation } from 'src/modules/ethereum/transactions/gasPrices/feeEstimation';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon, commonToBase } from 'src/shared/units/convert';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { Networks } from 'src/modules/networks/Networks';

function getGasPriceFromTransaction(
  transaction: IncomingTransaction
): GasPriceObject | null {
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = transaction;
  if (gasPrice) {
    return { classic: Number(gasPrice), eip1559: null, optimistic: null };
  }
  if (maxPriorityFeePerGas && maxFeePerGas) {
    return {
      eip1559: {
        priorityFee: Number(maxPriorityFeePerGas),
        maxFee: Number(maxFeePerGas),
      },
      classic: null,
      optimistic: null,
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
      optimistic: null,
    };
  }
  if (!chainGasPrices) {
    return null;
  }
  const speed = configuration.speed === 'custom' ? 'fast' : configuration.speed;
  return chainGasPrices[speed];
}

function useFeeEstimation(
  {
    chain,
    transaction,
    networkFeeConfiguration,
    chainGasPrices,
  }: {
    chain: Chain;
    transaction: IncomingTransaction;
    /** gas price derived from configuration takes precedence over gas price from transaction */
    networkFeeConfiguration: NetworkFeeConfiguration | null;
    chainGasPrices: ChainGasPrice | null;
  },
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
      chainGasPrices,
      gas,
    ],
    queryFn: async () => {
      const gasPriceFromTransaction = getGasPriceFromTransaction(transaction);
      const gasPriceFromConfiguration = getGasPriceFromConfiguration({
        chainGasPrices,
        configuration: networkFeeConfiguration,
      });
      const gasPrice =
        gasPriceFromConfiguration ||
        gasPriceFromTransaction ||
        (chainGasPrices ? chainGasPrices.fast : null);
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

function calculateTotalValue({
  txValue,
  fee,
}: {
  txValue: BigNumber;
  fee: number | BigNumber;
}) {
  return txValue.plus(typeof fee === 'number' ? String(fee) : fee.toFixed());
}

function calculateTransactionCosts({
  chain,
  networks,
  transaction,
  nativeAsset,
  nativeBalance,
  estimatedFeeValue,
}: {
  chain: Chain;
  networks: Networks;
  transaction: IncomingTransaction;
  nativeAsset: Asset | null;
  nativeBalance: BigNumber | null;
  estimatedFeeValue: EstimatedFeeValue;
}) {
  const txValue = new BigNumber((transaction.value ?? 0).toString());
  const { estimatedFee, maxFee = estimatedFee } = estimatedFeeValue;
  const totalValueBase = calculateTotalValue({ txValue, fee: estimatedFee });
  const maxTotalValueBase = calculateTotalValue({ txValue, fee: maxFee });

  const decimals = nativeAsset
    ? getDecimals({ asset: nativeAsset, chain })
    : networks?.getNetworkByName(chain)?.native_asset?.decimals;

  if (decimals == null) {
    return null;
  }

  const price = nativeAsset?.price?.value;
  const nativeBalanceBase =
    nativeBalance != null ? commonToBase(nativeBalance, decimals) : null;
  const isLowBalance =
    nativeBalanceBase != null ? maxTotalValueBase.gt(nativeBalanceBase) : false;
  const feeValueCommon = baseToCommon(estimatedFee, decimals);
  const feeValueFiat = price != null ? feeValueCommon.times(price) : null;
  const maxFeeValueCommon = baseToCommon(maxFee, decimals);
  const maxFeeValueFiat = price != null ? maxFeeValueCommon.times(price) : null;
  const txValueCommon = baseToCommon(txValue.toString(), decimals);
  const totalValueCommon = baseToCommon(totalValueBase.toString(), decimals);
  return {
    feeValueCommon,
    feeValueFiat,
    maxFeeValueCommon,
    maxFeeValueFiat,
    relevantFeeValueCommon: isLowBalance ? maxFeeValueCommon : feeValueCommon,
    relevantFeeValueFiat: isLowBalance ? maxFeeValueFiat : feeValueFiat,
    totalValueExceedsBalance: isLowBalance,
    txValueCommon,
    // TODO: add txValueFiat?
    totalValueCommon,
    totalValueFiat: price != null ? totalValueCommon.times(price) : null,
  };
}

const findMatchingEip1559 = (gasPrices: ChainGasPrice, eip1559: EIP1559) => {
  const isMatch = (value1: EIP1559, value2: EIP1559) =>
    value1.maxFee === value2.maxFee &&
    value1.priorityFee === value2.priorityFee;
  const { fast, average } = gasPrices;
  return [fast, average]
    .filter(isTruthy)
    .find(
      ({ eip1559: eip1559Info }) => eip1559Info && isMatch(eip1559Info, eip1559)
    );
};

function getFeeTime(
  gasPrice: GasPriceObject | null,
  chainGasPrices: ChainGasPrice | null
) {
  if (gasPrice?.eip1559 && chainGasPrices?.fast.eip1559) {
    // backend API only has time estimation for eip1559 info
    const eip1559Info = findMatchingEip1559(chainGasPrices, gasPrice.eip1559);
    const seconds = eip1559Info?.eta;
    if (seconds) {
      return `~${formatSeconds(seconds)}`;
    }
  }
}

export function useTransactionFee({
  address,
  transaction,
  chain,
  onFeeValueCommonReady,
  networkFeeConfiguration,
  chainGasPrices,
  keepPreviousData = false,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  networkFeeConfiguration: NetworkFeeConfiguration | null;
  keepPreviousData?: boolean;
  chainGasPrices: ChainGasPrice | null;
}) {
  const feeEstimationQuery = useFeeEstimation(
    { chain, transaction, networkFeeConfiguration, chainGasPrices },
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

  const { data: nativeBalance } = useNativeBalance({
    address,
    chain,
    staleTime: 10000,
  });

  const costs = useMemo(
    () =>
      networks && feeEstimation
        ? calculateTransactionCosts({
            chain,
            transaction,
            networks,
            estimatedFeeValue: feeEstimation,
            nativeAsset: nativeAsset || null,
            nativeBalance: nativeBalance.valueCommon ?? null,
          })
        : null,
    [chain, feeEstimation, nativeAsset, nativeBalance, networks, transaction]
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
