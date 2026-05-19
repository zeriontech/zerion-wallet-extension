import { useStatsigFeatureGate } from 'src/modules/statsig/statsig.client';

const GATE_NAME = 'users_affected_by_password_change_bug';

export function useAffectedByPasswordChangeBug() {
  const { data, isLoading } = useStatsigFeatureGate(GATE_NAME);
  return { isAffected: Boolean(data?.value), isLoading };
}
