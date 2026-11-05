import type { NetworkFeeConfiguration } from 'src/shared/types/TransactionConfiguration';
import {
  CUSTOM_NETWORK_FEE_TTL,
  resolveSavedNetworkFee,
  withSavedNetworkFee,
} from './networkFeePreference';

const NOW = 1_700_000_000_000;
const CHAIN = 'ethereum';

const customConfiguration: NetworkFeeConfiguration = {
  speed: 'custom',
  custom1559GasPrice: { maxFee: 30_000_000_000, priorityFee: 1_500_000_000 },
  customClassicGasPrice: null,
  gasLimit: '21000',
};

const classicCustomConfiguration: NetworkFeeConfiguration = {
  speed: 'custom',
  custom1559GasPrice: null,
  customClassicGasPrice: 20_000_000_000,
  gasLimit: null,
};

const averageConfiguration: NetworkFeeConfiguration = {
  speed: 'average',
  custom1559GasPrice: null,
  customClassicGasPrice: null,
  gasLimit: null,
};

describe('resolveSavedNetworkFee', () => {
  it('returns null without a saved entry', () => {
    expect(resolveSavedNetworkFee(undefined, CHAIN, NOW)).toBeNull();
    expect(resolveSavedNetworkFee({}, CHAIN, NOW)).toBeNull();
  });

  it('returns the saved preset', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      averageConfiguration,
      NOW
    );
    expect(resolveSavedNetworkFee(preferences, CHAIN, NOW)).toMatchObject({
      speed: 'average',
    });
  });

  it('returns a custom 1559 entry while it is younger than one day', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      customConfiguration,
      NOW
    );
    expect(
      resolveSavedNetworkFee(
        preferences,
        CHAIN,
        NOW + CUSTOM_NETWORK_FEE_TTL - 1
      )
    ).toEqual({
      speed: 'custom',
      custom1559GasPrice: {
        maxFee: 30_000_000_000,
        priorityFee: 1_500_000_000,
      },
      customClassicGasPrice: null,
      gasLimit: null,
    });
  });

  it('returns a custom classic entry', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      classicCustomConfiguration,
      NOW
    );
    expect(resolveSavedNetworkFee(preferences, CHAIN, NOW)).toMatchObject({
      speed: 'custom',
      customClassicGasPrice: 20_000_000_000,
    });
  });

  it('falls back to the preset after the custom entry expires', () => {
    const preferences = withSavedNetworkFee(
      withSavedNetworkFee(undefined, CHAIN, averageConfiguration, NOW),
      CHAIN,
      customConfiguration,
      NOW
    );
    expect(
      resolveSavedNetworkFee(preferences, CHAIN, NOW + CUSTOM_NETWORK_FEE_TTL)
    ).toMatchObject({ speed: 'average' });
  });

  it('drops an unusable custom entry and uses the preset', () => {
    const preferences = {
      [CHAIN]: {
        preset: 'average' as const,
        custom: { savedAt: NOW },
      },
    };
    expect(resolveSavedNetworkFee(preferences, CHAIN, NOW)).toMatchObject({
      speed: 'average',
    });
  });

  it('returns the preset with the retained custom values after switching to a preset', () => {
    const preferences = withSavedNetworkFee(
      withSavedNetworkFee(undefined, CHAIN, customConfiguration, NOW),
      CHAIN,
      averageConfiguration,
      NOW
    );
    expect(resolveSavedNetworkFee(preferences, CHAIN, NOW)).toEqual({
      speed: 'average',
      custom1559GasPrice: {
        maxFee: 30_000_000_000,
        priorityFee: 1_500_000_000,
      },
      customClassicGasPrice: null,
      gasLimit: null,
    });
  });

  it('returns the active custom entry over a retained one', () => {
    const preferences = withSavedNetworkFee(
      withSavedNetworkFee(undefined, CHAIN, averageConfiguration, NOW),
      CHAIN,
      customConfiguration,
      NOW
    );
    expect(resolveSavedNetworkFee(preferences, CHAIN, NOW)).toMatchObject({
      speed: 'custom',
    });
  });

  it('keeps chains independent', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      averageConfiguration,
      NOW
    );
    expect(resolveSavedNetworkFee(preferences, 'polygon', NOW)).toBeNull();
  });
});

describe('withSavedNetworkFee', () => {
  it('retains a saved custom entry as inactive when a preset is picked', () => {
    const withCustom = withSavedNetworkFee(
      undefined,
      CHAIN,
      customConfiguration,
      NOW
    );
    const withPreset = withSavedNetworkFee(
      withCustom,
      CHAIN,
      averageConfiguration,
      NOW
    );
    expect(withPreset[CHAIN]).toMatchObject({
      preset: 'average',
      customActive: false,
      custom: { savedAt: NOW },
    });
  });

  it('does not overwrite the preset when custom is picked', () => {
    const withAverage = withSavedNetworkFee(
      undefined,
      CHAIN,
      averageConfiguration,
      NOW
    );
    const withCustom = withSavedNetworkFee(
      withAverage,
      CHAIN,
      customConfiguration,
      NOW
    );
    expect(withCustom[CHAIN]).toMatchObject({ preset: 'average' });
  });

  it('defaults the preserved preset to fast', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      customConfiguration,
      NOW
    );
    expect(preferences[CHAIN]).toMatchObject({ preset: 'fast' });
  });

  it('does not store a custom entry without usable fees', () => {
    const preferences = withSavedNetworkFee(
      undefined,
      CHAIN,
      {
        speed: 'custom',
        custom1559GasPrice: null,
        customClassicGasPrice: null,
        gasLimit: '21000',
      },
      NOW
    );
    expect(preferences[CHAIN]).toBeUndefined();
  });
});
