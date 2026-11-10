import type {
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from 'src/shared/types/TransactionConfiguration';
import type {
  NetworkFeePreferences,
  SavedCustomNetworkFee,
} from 'src/shared/types/NetworkFeePreference';

/** Picking Custom keeps it for 24 hours, then the saved preset applies again. */
export const CUSTOM_NETWORK_FEE_TTL = 24 * 60 * 60 * 1000;

const PRESET_CONFIGURATION: Record<Exclude<NetworkFeeSpeed, 'custom'>, NetworkFeeConfiguration> = {
  fast: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
    gasLimit: null,
  },
  average: {
    speed: 'average',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
    gasLimit: null,
  },
};

function toCustomNetworkFeeConfiguration(
  custom: SavedCustomNetworkFee,
): NetworkFeeConfiguration | null {
  if (custom.maxFee != null && custom.priorityFee != null) {
    return {
      speed: 'custom',
      custom1559GasPrice: {
        maxFee: custom.maxFee,
        priorityFee: custom.priorityFee,
      },
      customClassicGasPrice: null,
      // Gas limit is transaction-specific and is always re-estimated.
      gasLimit: null,
    };
  }
  if (custom.gasPrice != null) {
    return {
      speed: 'custom',
      custom1559GasPrice: null,
      customClassicGasPrice: custom.gasPrice,
      gasLimit: null,
    };
  }
  return null;
}

/**
 * Resolve the network-fee level to start a transaction with on `chainId`.
 * An active Custom entry wins while it is younger than 24 hours; otherwise the
 * last picked Fast/Slow preset applies. A Custom entry that was deactivated by
 * picking a preset is still returned alongside that preset (for up to 24 hours)
 * so the custom form can show the values the user entered.
 */
export function resolveSavedNetworkFee(
  preferences: NetworkFeePreferences | undefined,
  chainId: string,
  now = Date.now(),
): NetworkFeeConfiguration | null {
  const saved = preferences?.[chainId];
  if (!saved) {
    return null;
  }
  const custom =
    saved.custom && now - saved.custom.savedAt < CUSTOM_NETWORK_FEE_TTL
      ? toCustomNetworkFeeConfiguration(saved.custom)
      : null;
  if (custom && saved.customActive !== false) {
    return custom;
  }
  const preset = PRESET_CONFIGURATION[saved.preset];
  if (custom) {
    return {
      ...preset,
      custom1559GasPrice: custom.custom1559GasPrice,
      customClassicGasPrice: custom.customClassicGasPrice,
      gasLimit: null,
    };
  }
  return preset;
}

function toSavedCustomNetworkFee(
  configuration: NetworkFeeConfiguration,
  savedAt: number,
): SavedCustomNetworkFee | null {
  if (configuration.custom1559GasPrice) {
    return {
      maxFee: configuration.custom1559GasPrice.maxFee,
      priorityFee: configuration.custom1559GasPrice.priorityFee,
      savedAt,
    };
  }
  if (configuration.customClassicGasPrice != null) {
    return {
      gasPrice: configuration.customClassicGasPrice,
      savedAt,
    };
  }
  return null;
}

/**
 * Apply a picked configuration to the per-chain preference map.
 * Preset picks replace the whole entry, which also clears any Custom entry for
 * that chain. Custom picks keep the existing preset as the post-expiry fallback.
 */
export function withSavedNetworkFee(
  preferences: NetworkFeePreferences | undefined,
  chainId: string,
  configuration: NetworkFeeConfiguration,
  now = Date.now(),
): NetworkFeePreferences {
  const current = preferences ?? {};
  if (configuration.speed !== 'custom') {
    return {
      ...current,
      [chainId]: {
        ...current[chainId],
        preset: configuration.speed,
        customActive: false,
      },
    };
  }
  const custom = toSavedCustomNetworkFee(configuration, now);
  if (!custom) {
    return current;
  }
  return {
    ...current,
    [chainId]: {
      preset: current[chainId]?.preset ?? 'fast',
      custom,
      customActive: true,
    },
  };
}
