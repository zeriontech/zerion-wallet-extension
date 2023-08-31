import { ethers } from 'ethers';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { walletPort } from 'src/ui/shared/channels';

export async function signMessage(message: string) {
  const signingMessage = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes(message)
  );
  return walletPort.request('personalSign', {
    params: [signingMessage],
    initiator: INTERNAL_ORIGIN,
  });
}
