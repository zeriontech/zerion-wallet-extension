/**
 * Persisted network-fee selection, one entry per chain and shared by every
 * wallet in this browser profile.
 *
 * `preset` is the last explicitly picked Fast/Slow level. `custom` is kept
 * separately so picking Custom never overwrites the preset it must fall back
 * to after the custom entry expires.
 */
export type NetworkFeePreset = 'fast' | 'average';

export interface SavedCustomNetworkFee {
  /** EIP-1559 max fee, in wei */
  maxFee?: number;
  /** EIP-1559 priority fee, in wei */
  priorityFee?: number;
  /** Classic gas price, in wei */
  gasPrice?: number;
  /** Unix timestamp (ms) when this custom entry was saved */
  savedAt: number;
}

export interface SavedNetworkFee {
  preset: NetworkFeePreset;
  custom?: SavedCustomNetworkFee;
  /**
   * Whether the custom entry is the active level. Switching to a preset keeps
   * the custom values but makes them inactive, so the next transaction starts
   * on the preset. Missing on old records, which treated custom as active.
   */
  customActive?: boolean;
}

export type NetworkFeePreferences = Record<string, SavedNetworkFee | undefined>;
