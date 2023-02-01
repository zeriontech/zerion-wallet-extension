import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
import type { WalletAbility } from 'src/shared/types/Daylight';

export function useFeedInfo() {
  const { data, ...queryResult } = useQuery(`getWalletFeed`, () =>
    walletPort.request('getFeedInfo')
  );
  const completedSet = useMemo(
    () => new Set(data?.completedAbilities?.map((item) => item.uid) || []),
    [data]
  );
  const dismissedSet = useMemo(
    () => new Set(data?.dismissedAbilities?.map((item) => item.uid) || []),
    [data]
  );
  return { ...queryResult, data, completedSet, dismissedSet };
}

export async function markAbility(params: {
  ability: WalletAbility;
  action: 'dismiss' | 'complete';
}) {
  return walletPort.request('markAbility', params);
}

export async function unmarkAbility(params: { abilityId: string }) {
  return walletPort.request('unmarkAbility', params);
}
