import { useStatsigFeatureGate } from 'src/modules/statsig/statsig.client';

export function useUKDetection() {
  const { data: isUK, isLoading } = useStatsigFeatureGate('crypto_disclaimer');
  return { isUK, isLoading };
}
