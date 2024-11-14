import type { Account } from 'src/background/account/Account';
import { getAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { getAddressesPortfolio } from './getTotalWalletsBalance';
import {
  getProviderForMixpanel,
  getProviderNameFromGroup,
} from './getProviderNameFromGroup';

async function getFundedWalletsCount(addresses: string[]) {
  // TODO: cache results and periodically make new checks only for non-funded addresses

  const result = await getAddressActivity(
    { addresses },
    { cachePolicy: 'cache-first' }
  );
  if (!result) {
    return 0;
  }
  return Object.values(result).reduce(
    (sum, value) => sum + (value.active ? 1 : 0),
    0
  );
}

async function getPortfolioStats(addresses: string[]) {
  return Promise.allSettled([
    getAddressesPortfolio(addresses),
    getFundedWalletsCount(addresses),
  ]).then(([result1, result2]) => {
    return {
      totalValue:
        result1.status === 'fulfilled' ? result1.value.total_value : null,
      fundedCount: result2.status === 'fulfilled' ? result2.value : null,
    };
  });
}

async function getZerionStats(addresses: string[]) {
  const results = await backgroundQueryClient.fetchQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', addresses],
    queryFn: () => ZerionAPI.getWalletsMetaByChunks(addresses),
    staleTime: 1000 * 60 * 60 * 12, // HALF A DAY
  });
  const stats = {
    zerion_premium_holder: false,
    og_dna_premium_holder: false,
    dna_holder: false,
  };
  for (const item of results) {
    if (item.membership.premium?.plan != null) {
      stats.zerion_premium_holder = true;
    }

    if (
      item.membership.premium?.plan &&
      item.membership.premium.expirationTime == null
    ) {
      stats.og_dna_premium_holder = true;
    }

    if (item.membership.tokens?.length) {
      stats.dna_holder = true;
    }

    if (
      stats.dna_holder &&
      stats.og_dna_premium_holder &&
      stats.zerion_premium_holder
    ) {
      // No need to make further checks
      break;
    }
  }
  return stats;
}

export async function getBaseMixpanelParams(account: Account) {
  const apiLayer = account.getCurrentWallet();
  const groups = await apiLayer.uiGetWalletGroups({
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  const addressesCount =
    groups?.reduce(
      (sum, group) => sum + group.walletContainer.wallets.length,
      0
    ) ?? 0;
  const ownedGroups = groups?.filter(
    (group) => !isReadonlyContainer(group.walletContainer)
  );
  const readonlyGroups = groups?.filter((group) =>
    isReadonlyContainer(group.walletContainer)
  );
  const readonlyAddressesCount = readonlyGroups?.reduce(
    (sum, group) => sum + group.walletContainer.wallets.length,
    0
  );
  const ownedAddresses = ownedGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address)
  );
  const ownedAddressesCount = ownedGroups?.reduce(
    (sum, group) => sum + group.walletContainer.wallets.length,
    0
  );

  const ownedWalletProviders = ownedGroups?.map((group) =>
    getProviderForMixpanel(getProviderNameFromGroup(group))
  );

  const portfolioStats = ownedAddresses?.length
    ? await getPortfolioStats(ownedAddresses)
    : null;
  const zerionStats = ownedAddresses?.length
    ? await getZerionStats(ownedAddresses)
    : null;
  return {
    num_favourite_tokens: 0,
    num_wallets: addressesCount,
    num_watch_list_wallets: readonlyAddressesCount,
    num_watch_list_wallets_with_provider: 0,
    num_my_wallets: ownedAddressesCount,
    num_my_wallets_with_provider: ownedAddressesCount,
    num_wallets_with_provider: ownedAddressesCount,
    num_funded_wallets_with_provider: portfolioStats?.fundedCount ?? 0,
    num_zerion_wallets: ownedAddressesCount,
    num_connected_wallets: 0,
    num_wallet_groups: groups?.length ?? 0,
    total_balance: portfolioStats?.totalValue ?? 0,
    currency: 'usd',
    language: 'en',
    zerion_premium_holder: zerionStats?.zerion_premium_holder ?? false,
    og_dna_premium_holder: zerionStats?.og_dna_premium_holder ?? false,
    dna_holder: zerionStats?.dna_holder ?? false,
    wallet_providers: Array.from(new Set(ownedWalletProviders)),
  };
}
