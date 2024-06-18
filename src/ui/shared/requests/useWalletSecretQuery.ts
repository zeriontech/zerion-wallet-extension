import { useQuery } from '@tanstack/react-query';
import { SeedType } from 'src/shared/SeedType';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import { walletPort } from 'src/ui/shared/channels';

async function getSecretValue({
  address,
  groupId,
  seedType,
}: {
  address?: string | null;
  groupId?: string | null;
  seedType: SeedType;
}): Promise<
  | { seedType: SeedType.privateKey; value: string }
  | { seedType: SeedType.mnemonic; value: LocallyEncoded }
> {
  if (seedType === SeedType.privateKey) {
    if (!address) {
      throw new Error('Address param is required for privateKey seedType');
    }
    const value = await walletPort.request('getPrivateKey', { address });
    return { value, seedType };
  } else if (seedType === SeedType.mnemonic) {
    if (!groupId) {
      throw new Error('GroupId param is required for mnemonic seedType');
    }
    const mnemonic = await walletPort.request('getRecoveryPhrase', { groupId });
    return { value: mnemonic.phrase, seedType };
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
