import { useQuery } from '@tanstack/react-query';
import { getStatsigExperiment, getStatsigFeatureGate } from './shared';

export const ONRAMP_EXPERIMENT_NAME = 'web-onramp_flow';

export function useStatsigExperiment(
  name: string,
  {
    suspense = false,
    enabled = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['getStatsigExperiment', name],
    queryFn: () => getStatsigExperiment(name),
    staleTime: Infinity, // never refetch experiment status while UI is open
    enabled,
    suspense,
  });
}

export function useStatsigFeatureGate(
  name: string,
  {
    suspense = false,
    enabled = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['getStatsigFeatureGate', name],
    queryFn: () => getStatsigFeatureGate(name),
    staleTime: Infinity, // never refetch feature gate status while UI is open
    enabled,
    suspense,
  });
}
