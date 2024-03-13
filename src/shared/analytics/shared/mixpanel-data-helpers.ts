import type { Account } from 'src/background/account/Account';
import { getAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { getAddressesPortfolio } from './getTotalWalletsBalance';

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
  const response = await backgroundQueryClient.fetchQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', addresses],
    queryFn: () => ZerionAPI.getWalletsMeta({ identifiers: addresses }),
    staleTime: 1000 * 60 * 60 * 12, // HALF A DAY
  });
  if (!response.data) {
    return null;
  }
  const stats = {
    zerion_premium_holder: false,
    og_dna_premium_holder: false,
    dna_holder: false,
  };
  for (const item of response.data) {
    if (item.membership.premium) {
      stats.zerion_premium_holder = true;
    }
    if (item.membership.premium?.features.early_access) {
      // TODO: make sure this is the right check
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
  const getUserId = () => account.getUser()?.id;
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
  const ownedAddresses = ownedGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address)
  );
  const ownedAddressesCount = ownedGroups?.reduce(
    (sum, group) => sum + group.walletContainer.wallets.length,
    0
  );
  const userId = getUserId();

  const portfolioStats = ownedAddresses?.length
    ? await getPortfolioStats(ownedAddresses)
    : null;
  const zerionStats = ownedAddresses?.length
    ? await getZerionStats(ownedAddresses)
    : null;
  return {
    $user_id: userId,
    num_favourite_tokens: 0,
    user_id: userId,

    num_wallets: addressesCount,
    num_watch_list_wallets: 0,
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
  };
}
