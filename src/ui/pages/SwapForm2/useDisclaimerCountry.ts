import { useStore } from '@store-unit/react';
import { useDetectedCountry } from 'src/modules/zerion-api/hooks/useDetectedCountry';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import type { DisclaimerOverride } from 'src/ui/features/dev-menu/store-types';

/**
 * Resolves a geo-gated disclaimer against the country `geo/country/v1` derives
 * from the request IP. While the request is in flight — or if it fails — the
 * answer is `false`: the banner appears once the country is known instead of
 * being guessed and then retracted.
 */
function useIsDetectedCountry(
  countryCode: string,
  override: DisclaimerOverride
) {
  const { data } = useDetectedCountry();
  if (override === 'force-on') {
    return true;
  }
  if (override === 'force-off') {
    return false;
  }
  return data?.data.countryCode === countryCode;
}

export function useUSDetection() {
  const { usDisclaimerOverride } = useStore(devMenuStore);
  return { isUS: useIsDetectedCountry('US', usDisclaimerOverride) };
}

export function useUKDetection() {
  const { ukDisclaimerOverride } = useStore(devMenuStore);
  return { isUK: useIsDetectedCountry('GB', ukDisclaimerOverride) };
}
