import {
  getProviderForApiV4,
  getProviderNameFromGroup,
} from 'src/shared/analytics/shared/getProviderNameFromGroup';
import { walletPort } from 'src/ui/shared/channels';

export async function getAddressProviderHeader(address: string) {
  const group = await walletPort.request('getWalletGroupByAddress', {
    address,
  });
  return getProviderForApiV4(getProviderNameFromGroup(group));
}
