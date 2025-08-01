import type { PortfolioDecomposition } from 'defi-sdk';
import type { Account } from 'src/background/account/Account';
import { getAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
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
      portfolio: result1.status === 'fulfilled' ? result1.value : null,
      fundedCount: result2.status === 'fulfilled' ? result2.value : null,
    };
  });
}

async function getZerionStats({
  ownedWalletsMeta,
}: {
  ownedWalletsMeta: WalletMeta[];
}) {
  const stats = {
    zerion_premium_holder: false,
    og_dna_premium_holder: false,
    dna_holder: false,
    was_invited: false,
  };
  for (const walletMeta of ownedWalletsMeta) {
    if (walletMeta.membership.premium?.plan != null) {
      stats.zerion_premium_holder = true;
    }

    if (
      walletMeta.membership.premium?.plan &&
      walletMeta.membership.premium.expirationTime == null
    ) {
      stats.og_dna_premium_holder = true;
    }

    if (walletMeta.membership.tokens?.length) {
      stats.dna_holder = true;
    }

    if (walletMeta.membership.referrer) {
      stats.was_invited = true;
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

async function fetchWalletsMeta({ addresses }: { addresses: string[] }) {
  return backgroundQueryClient.fetchQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', addresses],
    queryFn: () => ZerionAPI.getWalletsMetaByChunks(addresses),
    staleTime: 1000 * 60 * 60 * 12, // HALF A DAY
  });
}

function getChainBreakdown(portfolio: PortfolioDecomposition | null) {
  const chainBreakdown: Record<string, number> = {};
  if (portfolio) {
    for (const internalId in portfolio.positions_chains_distribution) {
      const key = `${internalId}_balance`;
      chainBreakdown[key] = portfolio.positions_chains_distribution[internalId];
    }
  }
  return chainBreakdown;
}

export async function getUserProperties(account: Account) {
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
  const readonlyAddresses = readonlyGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address)
  );
  const readonlyAddressesCount = readonlyAddresses?.length ?? 0;
  const ownedAddresses = ownedGroups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address)
  );
  const ownedAddressesCount = ownedAddresses?.length ?? 0;

  const ownedWalletsMeta = ownedAddresses?.length
    ? await fetchWalletsMeta({ addresses: ownedAddresses })
    : null;
  const readonlyWalletsMeta = readonlyAddresses?.length
    ? await fetchWalletsMeta({ addresses: readonlyAddresses })
    : null;

  const eligibleOwnedAddresses =
    ownedWalletsMeta
      ?.filter((meta) => Boolean(meta.membership.retro))
      .map((meta) => normalizeAddress(meta.address)) ?? [];
  const eligibleReadonlyAddresses =
    readonlyWalletsMeta
      ?.filter((meta) => Boolean(meta.membership.retro))
      .map((meta) => normalizeAddress(meta.address)) ?? [];

  const ownedWalletProviders = ownedGroups?.map((group) =>
    getProviderForMixpanel(getProviderNameFromGroup(group))
  );

  const portfolioStats = ownedAddresses?.length
    ? await getPortfolioStats(ownedAddresses)
    : null;
  const zerionStats = ownedWalletsMeta
    ? await getZerionStats({ ownedWalletsMeta })
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
    total_balance: portfolioStats?.portfolio?.total_value ?? 0,
    ...getChainBreakdown(portfolioStats?.portfolio ?? null),
    currency: 'usd',
    language: 'en',
    zerion_premium_holder: zerionStats?.zerion_premium_holder ?? false,
    og_dna_premium_holder: zerionStats?.og_dna_premium_holder ?? false,
    dna_holder: zerionStats?.dna_holder ?? false,
    was_invited: zerionStats?.was_invited ?? false,
    wallet_providers: Array.from(new Set(ownedWalletProviders)),
    num_zerion_wallets_eligible_for_xp_drop: eligibleOwnedAddresses.length,
    num_readonly_wallets_eligible_for_xp_drop: eligibleReadonlyAddresses.length,
  };
}
