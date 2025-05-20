import { isNumeric } from 'src/shared/isNumeric';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { SendFormState } from './SendFormState';

export function toConfiguration(formState: SendFormState): CustomConfiguration {
  const { maxFee, priorityFee, nonce, gasPrice } = formState;
  return {
    networkFee: {
      speed: formState.networkFeeSpeed || 'fast',
      custom1559GasPrice:
        maxFee && isNumeric(maxFee) && priorityFee && isNumeric(priorityFee)
          ? { maxFee: Number(maxFee), priorityFee: Number(priorityFee) }
          : null,
      customClassicGasPrice:
        gasPrice && isNumeric(gasPrice) ? Number(gasPrice) : null,
      gasLimit: formState.gasLimit || null,
    },
    slippage: null,
    nonce: nonce && isNumeric(nonce) ? nonce : null,
  };
}

export function fromConfiguration(
  configuration: CustomConfiguration
): Partial<SendFormState> {
  const toString = (value: number | undefined | null) => {
    return value == null ? '' : BigInt(value || 0).toString();
  };
  return {
    networkFeeSpeed: configuration.networkFee.speed,
    maxFee: toString(configuration.networkFee.custom1559GasPrice?.maxFee),
    priorityFee: toString(
      configuration.networkFee.custom1559GasPrice?.priorityFee
    ),
    gasLimit: configuration.networkFee.gasLimit || undefined,
    gasPrice: toString(configuration.networkFee.customClassicGasPrice),
    nonce: configuration.nonce?.toString(),
  };
}
