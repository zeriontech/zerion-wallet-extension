import type { Account } from 'src/background/account/Account';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/constants';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { getProviderForMixpanel, getProviderNameFromGroup } from './getProviderNameFromGroup';

export async function getUserProperties(account: Account) {
  const apiLayer = account.getCurrentWallet();
  const groups = await apiLayer.uiGetWalletGroups({
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  const addressesCount =
    groups?.reduce((sum, group) => sum + group.walletContainer.wallets.length, 0) ?? 0;
  const ownedGroups = groups?.filter((group) => !isReadonlyContainer(group.walletContainer));
  const readonlyGroups = groups?.filter((group) => isReadonlyContainer(group.walletContainer));
  const readonlyAddresses = readonlyGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address),
  );
  const readonlyAddressesCount = readonlyAddresses?.length ?? 0;
  const readonlySolanaAddressesCount = readonlyAddresses?.filter((address) =>
    isSolanaAddress(address),
  ).length;
  const readonlyEvmAddressesCount = readonlyAddresses?.filter((address) =>
    isEthereumAddress(address),
  ).length;

  const ownedAddresses = ownedGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address),
  );
  const ownedAddressesCount = ownedAddresses?.length ?? 0;

  const ownedWalletProviders = ownedGroups?.map((group) =>
    getProviderForMixpanel(getProviderNameFromGroup(group)),
  );

  const ownedSolanaAddressesCount = ownedAddresses?.filter((address) =>
    isSolanaAddress(address),
  ).length;
  const ownedEvmAddressesCount = ownedAddresses?.filter((address) =>
    isEthereumAddress(address),
  ).length;

  return {
    num_favourite_tokens: 0,
    num_wallets: addressesCount,
    num_watch_list_wallets: readonlyAddressesCount,
    num_watch_list_wallets_with_provider: 0,
    num_my_wallets: ownedAddressesCount,
    num_my_wallets_with_provider: ownedAddressesCount,
    num_wallets_with_provider: ownedAddressesCount,
    num_zerion_wallets: ownedAddressesCount,
    num_connected_wallets: 0,
    num_wallet_groups: groups?.length ?? 0,
    num_solana_wallets: ownedSolanaAddressesCount ?? 0,
    num_evm_wallets: ownedEvmAddressesCount ?? 0,
    num_watchlist_solana_wallets: readonlySolanaAddressesCount ?? 0,
    num_watchlist_evm_wallets: readonlyEvmAddressesCount ?? 0,
    currency: 'usd',
    language: 'en',
    wallet_providers: Array.from(new Set(ownedWalletProviders)),
  };
}
