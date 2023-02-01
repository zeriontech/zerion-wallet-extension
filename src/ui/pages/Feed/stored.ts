import { useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
import type { WalletAbility } from 'src/shared/types/Daylight';

export function useFeedInfo() {
  return useQuery('getFeedInfo', async () => {
    const feed = await walletPort.request('getFeedInfo');
    const { completedAbilities, dismissedAbilities } = feed;
    return {
      feed,
      completedSet: new Set(completedAbilities.map((item) => item.uid)),
      dismissedSet: new Set(dismissedAbilities.map((item) => item.uid)),
    };
  });
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
