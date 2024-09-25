import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import {
  getProviderForApiV4,
  getProviderNameFromGroup,
} from 'src/shared/analytics/shared/getProviderNameFromGroup';
import type { Wallet } from 'src/shared/types/Wallet';

export async function getAddressProviderHeader(
  wallet: Wallet,
  address: string
) {
  const group = await wallet.getWalletGroupByAddress({
    params: { address },
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  return getProviderForApiV4(getProviderNameFromGroup(group));
}
