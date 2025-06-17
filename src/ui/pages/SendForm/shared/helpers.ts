import { isNumeric } from 'src/shared/isNumeric';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { gweiToWei, weiToGwei } from 'src/shared/units/formatGasPrice';
import type { SwapFormState } from '../../SwapForm/shared/SwapFormState';
import type { SendFormState } from './SendFormState';

type NetworkFeeSubset = Pick<
  SwapFormState | SendFormState,
  | 'maxFee'
  | 'maxPriorityFee'
  | 'nonce'
  | 'gasPrice'
  | 'gasLimit'
  | 'slippage'
  | 'networkFeeSpeed'
>;

export function toConfiguration(
  formState: NetworkFeeSubset
): CustomConfiguration {
  const { maxFee, maxPriorityFee, nonce, gasPrice, slippage } = formState;
  return {
    networkFee: {
      speed: formState.networkFeeSpeed || 'fast',
      custom1559GasPrice:
        maxFee &&
        isNumeric(maxFee) &&
        maxPriorityFee &&
        isNumeric(maxPriorityFee)
          ? {
              // TODO: Do not convert. When other forms update to the new Swap API,
              // remove conversion in NetworkFeeDialog and here
              maxFee: gweiToWei(maxFee),
              priorityFee: gweiToWei(maxPriorityFee),
            }
          : null,
      customClassicGasPrice:
        gasPrice && isNumeric(gasPrice) ? gweiToWei(gasPrice) : null,
      gasLimit: formState.gasLimit || null,
    },
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
  return {
    networkFeeSpeed:
      configuration.networkFee.speed === 'fast'
        ? undefined
        : configuration.networkFee.speed,
    maxFee: toGwei(configuration.networkFee.custom1559GasPrice?.maxFee),
    maxPriorityFee: toGwei(
      configuration.networkFee.custom1559GasPrice?.priorityFee
    ),
    gasLimit: configuration.networkFee.gasLimit || undefined,
    gasPrice: toGwei(configuration.networkFee.customClassicGasPrice),
    nonce: configuration.nonce
      ? BigInt(configuration.nonce).toString()
      : undefined,
    slippage:
      configuration.slippage != null
        ? String(configuration.slippage)
        : undefined,
  };
}
