import { useStatsigFeatureGate } from 'src/modules/statsig/statsig.client';

export function useUKDetection() {
  const { data, isLoading } = useStatsigFeatureGate('crypto_disclaimer');
  return { isUK: Boolean(data?.value), isLoading };
}
