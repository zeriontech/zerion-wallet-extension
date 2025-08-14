import type { PortfolioDecomposition } from 'defi-sdk';
import type { Account } from 'src/background/account/Account';
import { getAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type {
  PremiumPlan,
  WalletMeta,
} from 'src/modules/zerion-api/requests/wallet-get-meta';
import { PREMIUM_PRIORITY } from 'src/modules/zerion-api/requests/wallet-get-meta';
import { getAddressesPortfolio } from './getTotalWalletsBalance';
import {
  getProviderForMixpanel,
  getProviderNameFromGroup,
} from './getProviderNameFromGroup';
import { omitNullParams } from './omitNullParams';

function getFundedStatsByEcosystem(
  activity: Awaited<ReturnType<typeof getAddressActivity>>
): { totalCount: number; solanaFundedCount: number; evmFundedCount: number } {
  if (!activity) {
    return {
      totalCount: 0,
      solanaFundedCount: 0,
      evmFundedCount: 0,
    };
  }
  const count = (values: Array<{ active: boolean }>) =>
    values.reduce((sum, value) => sum + (value.active ? 1 : 0), 0);

  const values = Object.values(activity);
  return {
    totalCount: count(values),
    evmFundedCount: count(
      values.filter((value) => isEthereumAddress(value.address))
    ),
    solanaFundedCount: count(
      values.filter((value) => isSolanaAddress(value.address))
    ),
  };
}

async function getPortfolioStats(addresses: string[]) {
  return Promise.allSettled([
    getAddressesPortfolio(addresses),
    getAddressActivity({ addresses }, { cachePolicy: 'cache-first' }),
  ]).then(([result1, result2]) => {
    return {
      portfolio: result1.status === 'fulfilled' ? result1.value : null,
      addressActivity: result2.status === 'fulfilled' ? result2.value : null,
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
    zerion_premium_plan: null as PremiumPlan | null,
    zerion_premium_expiration_date: null as string | null,
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
      if (
        !stats.zerion_premium_plan ||
        PREMIUM_PRIORITY[stats.zerion_premium_plan] >
          PREMIUM_PRIORITY[walletMeta.membership.premium.plan]
      ) {
        stats.zerion_premium_plan = walletMeta.membership.premium.plan;
        stats.zerion_premium_expiration_date =
          walletMeta.membership.premium.expirationTime;
      }
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
  return omitNullParams(stats);
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
  const readonlySolanaAddressesCount = readonlyAddresses?.filter((address) =>
    isSolanaAddress(address)
  ).length;
  const readonlyEvmAddressesCount = readonlyAddresses?.filter((address) =>
    isEthereumAddress(address)
  ).length;

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
  const fundedStatsByEcosystem = getFundedStatsByEcosystem(
    portfolioStats?.addressActivity ?? null
  );

  const ownedSolanaAddressesCount = ownedAddresses?.filter((address) =>
    isSolanaAddress(address)
  ).length;
  const ownedEvmAddressesCount = ownedAddresses?.filter((address) =>
    isEthereumAddress(address)
  ).length;

  return {
    num_favourite_tokens: 0,
    num_wallets: addressesCount,
    num_watch_list_wallets: readonlyAddressesCount,
    num_watch_list_wallets_with_provider: 0,
    num_my_wallets: ownedAddressesCount,
    num_my_wallets_with_provider: ownedAddressesCount,
    num_wallets_with_provider: ownedAddressesCount,
    num_funded_wallets_with_provider: fundedStatsByEcosystem.totalCount,
    num_zerion_wallets: ownedAddressesCount,
    num_connected_wallets: 0,
    num_wallet_groups: groups?.length ?? 0,
    num_solana_wallets: ownedSolanaAddressesCount ?? 0,
    num_funded_solana_wallets: fundedStatsByEcosystem.solanaFundedCount,
    num_evm_wallets: ownedEvmAddressesCount ?? 0,
    num_funded_evm_wallets: fundedStatsByEcosystem.evmFundedCount,
    num_watchlist_solana_wallets: readonlySolanaAddressesCount ?? 0,
    num_watchlist_evm_wallets: readonlyEvmAddressesCount ?? 0,
    total_balance: portfolioStats?.portfolio?.total_value ?? 0,
    ...getChainBreakdown(portfolioStats?.portfolio ?? null),
    currency: 'usd',
    language: 'en',
    zerion_premium_holder: zerionStats?.zerion_premium_holder ?? false,
    og_dna_premium_holder: zerionStats?.og_dna_premium_holder ?? false,
    zerion_premium_plan: zerionStats?.zerion_premium_plan ?? null,
    zerion_premium_expiration_date:
      zerionStats?.zerion_premium_expiration_date ?? null,
    dna_holder: zerionStats?.dna_holder ?? false,
    was_invited: zerionStats?.was_invited ?? false,
    wallet_providers: Array.from(new Set(ownedWalletProviders)),
    num_zerion_wallets_eligible_for_xp_drop: eligibleOwnedAddresses.length,
    num_readonly_wallets_eligible_for_xp_drop: eligibleReadonlyAddresses.length,
  };
}
