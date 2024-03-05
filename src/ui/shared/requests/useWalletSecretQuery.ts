import { useQuery } from '@tanstack/react-query';
import { SeedType } from 'src/shared/SeedType';
import { walletPort } from 'src/ui/shared/channels';

async function getSecretValue({
  address,
  groupId,
  seedType,
}: {
  address?: string | null;
  groupId?: string | null;
  seedType: SeedType;
}) {
  if (seedType === SeedType.privateKey) {
    if (!address) {
      throw new Error('Address param is required for privateKey seedType');
    }
    const rawPrivateKey = await walletPort.request('getPrivateKey', {
      address,
    });
    // remove 0x prefix for better compatibility with other wallets
    return rawPrivateKey.slice(2);
  } else if (seedType === SeedType.mnemonic) {
    if (!groupId) {
      throw new Error('GroupId param is required for mnemonic seedType');
    }
    const mnemonic = await walletPort.request('getRecoveryPhrase', { groupId });
    return mnemonic.phrase;
  } else {
    throw new Error('Unexpected seedType');
  }
}

export function useSecretValue({
  address,
  groupId,
  seedType,
}: {
  seedType: SeedType;
  address?: string | null;
  groupId?: string | null;
}) {
  return useQuery({
    queryKey: ['getSecretValue', address, groupId, seedType],
    queryFn: () => getSecretValue({ address, groupId, seedType }),
    useErrorBoundary: false,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
