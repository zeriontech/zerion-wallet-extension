import { useQuery } from '@tanstack/react-query';
import { SeedType } from 'src/shared/SeedType';
import { walletPort } from '../channels';

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
    return walletPort.request('getPrivateKey', { address });
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
  return useQuery(
    ['getSecretValue', address, groupId],
    () => getSecretValue({ address, groupId, seedType }),
    {
      useErrorBoundary: true,
      cacheTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
}
