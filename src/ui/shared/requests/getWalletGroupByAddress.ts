import { walletPort } from '../channels';

export function getWalletGroupByAddress(address: string) {
  return walletPort.request('getWalletGroupByAddress', { address });
}
