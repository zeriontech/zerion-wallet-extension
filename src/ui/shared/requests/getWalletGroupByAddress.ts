import { walletPort } from 'src/ui/shared/channels';

export function getWalletGroupByAddress(address: string) {
  return walletPort.request('getWalletGroupByAddress', { address });
}
