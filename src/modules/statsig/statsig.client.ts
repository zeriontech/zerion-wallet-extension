import { useQuery } from '@tanstack/react-query';
import { fetchGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { getStatsigExperiment, getStatsigFeatureGate } from './shared';

export const ONRAMP_EXPERIMENT_NAME = 'web-onramp_flow';
export const APPROVE_AND_TRADE_EXPERIMENT =
  'extension-approve_and_trade_in_1_action';

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
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['getStatsigExperiment', name],
    queryFn: async () => {
      const prefs = await fetchGlobalPreferences();
      const override = prefs.statsigOverrides?.[name];
      if (override) {
        return { name, group: override.group, group_name: override.group_name };
      }
      return getStatsigExperiment(name);
    },
    staleTime: Infinity, // never refetch experiment status while UI is open
    enabled,
    suspense,
  });
}

export function useApproveAndTradeInOneAction() {
  const { data } = useStatsigExperiment(APPROVE_AND_TRADE_EXPERIMENT);
  return data?.group_name === 'test';
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
