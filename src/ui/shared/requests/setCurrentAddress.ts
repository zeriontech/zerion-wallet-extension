import { walletPort } from '../channels';
import { emitter } from '../events';

export async function setCurrentAddress({ address }: { address: string }) {
  return walletPort.request('setCurrentAddress', { address }).then((result) => {
    emitter.emit('uiAccountsChanged');
    return result;
  });
}
