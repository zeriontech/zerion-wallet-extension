import { hashQueryKey, useQuery } from '@tanstack/react-query';
import {
  interpretSignature,
  interpretTransaction,
} from 'src/modules/ethereum/transactions/interpret';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import {
  getPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { fetchAndAssignPaymaster } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { Client } from 'defi-sdk';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { EligibilityQuery } from 'src/ui/components/address-action/EligibilityQuery';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { walletPort } from '../channels';

/**
 * Interprets Paymaster Transaction if it is eligible
 * or a regular transaction otherwise
 */
export async function interpretTxBasedOnEligibility({
  address,
  transaction,
  chain,
  eligibilityQueryData,
  eligibilityQueryStatus,
  currency,
  origin,
  client,
}: {
  address: string;
  transaction: MultichainTransaction;
  chain: Chain;
  eligibilityQueryData: boolean | undefined;
  eligibilityQueryStatus: 'error' | 'success' | 'loading';
  currency: string;
  origin: string;
  client: Client;
}) {
  const preferences = await getPreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const networksStore = await getNetworksStore();
  const network = await networksStore.fetchNetworkById(chain.toString());
  if (!network.supports_simulations) {
    return null;
  }
  const shouldDoRegularInterpret =
    !network.supports_sponsored_transactions ||
    eligibilityQueryData === false ||
    eligibilityQueryStatus === 'error' ||
    transaction.solana;

  if (shouldDoRegularInterpret) {
    return interpretTransaction({
      address,
      transaction,
      chain,
      origin,
      currency,
      client,
    });
  } else if (
    network.supports_sponsored_transactions &&
    eligibilityQueryData &&
    transaction.evm
  ) {
    const toSign = await fetchAndAssignPaymaster(transaction.evm, {
      source,
      apiClient: ZerionAPI,
    });
    const typedData = await walletPort.request('uiGetEip712Transaction', {
      transaction: toSign,
    });
    return interpretSignature({
      address,
      chainId: normalizeChainId(toSign.chainId),
      typedData,
      currency,
      origin,
      client,
    });
  } else {
    return null;
  }
}

export function useInterpretTxBasedOnEligibility({
  address,
  chain,
  transaction,
  eligibilityQuery,
  origin,
}: {
  address: string;
  chain: Chain;
  transaction: MultichainTransaction;
  eligibilityQuery: EligibilityQuery;
  origin: string;
}) {
  const client = useDefiSdkClient();
  const { currency } = useCurrency();
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';

  // Failing to keepPreviousData currently may break AllowanceView
  // component because we will pass a nullish requestedAllowanceQuantityBase during refetch
  const keepPreviousData = true;

  return useQuery({
    suspense: false,
    keepPreviousData,
    refetchOnWindowFocus: false,
    queryKey: [
      'interpretTransaction',
      client,
      currency,
      transaction,
      address,
      chain,
      source,
      origin,
      eligibilityQuery.data?.data.eligible,
      eligibilityQuery.status,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () => {
      return interpretTxBasedOnEligibility({
        address,
        chain,
        transaction,
        eligibilityQueryData: eligibilityQuery.data?.data.eligible,
        eligibilityQueryStatus: eligibilityQuery.status,
        currency,
        origin,
        client,
      });
    },
  });
}
