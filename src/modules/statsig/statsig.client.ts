import { useQuery } from '@tanstack/react-query';
import { fetchGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { getStatsigExperiment, getStatsigFeatureGate } from './shared';

export const ONRAMP_EXPERIMENT_NAME = 'web-onramp_flow';
export const APPROVE_AND_TRADE_EXPERIMENT =
  'extension-approve_and_trade_in_1_action';
export const AUTOSLIPPAGE_EXPERIMENT = 'web_-_autoslippage_testing';

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
  return data?.group_name === 'Group1';
}

/**
 * Autoslippage A/B experiment (`web_-_autoslippage_testing`).
 * - Test group sees the "Auto" slippage option and defaults to it.
 * - Control (and any unresolved/failed state) hides Auto and uses the static
 *   chain default.
 * The resolved `group` label is reported to analytics as `autoslippage_test_group`.
 */
export function useAutoslippageExperiment() {
  const { data, isLoading } = useStatsigExperiment(AUTOSLIPPAGE_EXPERIMENT);
  // Fall back to "Control" until the experiment resolves, so we never grant
  // Auto mode to a user before we know their group.
  const group = data?.group_name ?? 'Control';
  return {
    group,
    isTestGroup: group === 'Group1',
    isLoading,
  };
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
