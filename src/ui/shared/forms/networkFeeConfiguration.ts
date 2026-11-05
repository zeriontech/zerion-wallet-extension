import { isNumeric } from 'src/shared/isNumeric';
import type {
  CustomConfiguration,
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from 'src/shared/types/TransactionConfiguration';
import { gweiToWei, weiToGwei } from 'src/shared/units/formatGasPrice';

type NetworkFeeSubset = {
  networkFeeSpeed?: NetworkFeeSpeed;
  maxFee?: string;
  maxPriorityFee?: string;
  gasPrice?: string;
  gasLimit?: string;
  nonce?: string;
  slippage?: string;
};

export function toConfiguration(
  formState: NetworkFeeSubset,
  savedNetworkFee: NetworkFeeConfiguration | null = null
): CustomConfiguration {
  const { maxFee, maxPriorityFee, nonce, gasPrice, slippage } = formState;
  const isCustom = formState.networkFeeSpeed === 'custom';
  const retainedCustom = savedNetworkFee
    ? {
        custom1559GasPrice: savedNetworkFee.custom1559GasPrice,
        customClassicGasPrice: savedNetworkFee.customClassicGasPrice,
      }
    : null;
  const networkFee: NetworkFeeConfiguration = formState.networkFeeSpeed
    ? {
        speed: formState.networkFeeSpeed,
        custom1559GasPrice: isCustom
          ? maxFee &&
            isNumeric(maxFee) &&
            maxPriorityFee &&
            isNumeric(maxPriorityFee)
            ? {
                // TODO: Do not convert. When other forms update to the new Swap API,
                // remove conversion in NetworkFeeDialog and here
                maxFee: gweiToWei(maxFee),
                priorityFee: gweiToWei(maxPriorityFee),
              }
            : null
          : retainedCustom?.custom1559GasPrice ?? null,
        customClassicGasPrice: isCustom
          ? gasPrice && isNumeric(gasPrice)
            ? gweiToWei(gasPrice)
            : null
          : retainedCustom?.customClassicGasPrice ?? null,
        gasLimit: isCustom ? formState.gasLimit || null : null,
      }
    : savedNetworkFee ?? {
        speed: 'fast',
        custom1559GasPrice: null,
        customClassicGasPrice: null,
        gasLimit: null,
      };
  return {
    networkFee,
    slippage: slippage != null && isNumeric(slippage) ? Number(slippage) : null,
    nonce: nonce && isNumeric(nonce) ? nonce : null,
  };
}

export function fromConfiguration(
  configuration: CustomConfiguration
): NetworkFeeSubset {
  const toGwei = (value: number | undefined | null) => {
    return value == null ? '' : String(weiToGwei(value));
  };
  const isCustom = configuration.networkFee.speed === 'custom';
  return {
    networkFeeSpeed:
      configuration.networkFee.speed === 'fast'
        ? undefined
        : configuration.networkFee.speed,
    maxFee: isCustom
      ? toGwei(configuration.networkFee.custom1559GasPrice?.maxFee)
      : undefined,
    maxPriorityFee: isCustom
      ? toGwei(configuration.networkFee.custom1559GasPrice?.priorityFee)
      : undefined,
    gasLimit: isCustom
      ? configuration.networkFee.gasLimit || undefined
      : undefined,
    gasPrice: isCustom
      ? toGwei(configuration.networkFee.customClassicGasPrice)
      : undefined,
    nonce: configuration.nonce
      ? BigInt(configuration.nonce).toString()
      : undefined,
    slippage:
      configuration.slippage != null
        ? String(configuration.slippage)
        : undefined,
  };
}
