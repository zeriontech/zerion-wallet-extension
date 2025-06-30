import { useQuery } from '@tanstack/react-query';
import { getStatsigExperiment } from './shared';

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
