import { hashQueryKey, useQuery } from '@tanstack/react-query';
import {
  interpretSignature,
  interpretTransaction,
} from 'src/modules/ethereum/transactions/interpret';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { invariant } from 'src/shared/invariant';
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
import { walletPort } from '../channels';

/**
 * Interprets Paymaster Transaction if it is eligible
 * or a regular transaction otherwise
 */
export async function interpretTxBasedOnEligibility({
  transaction,
  eligibilityQueryData,
  eligibilityQueryStatus,
  currency,
  origin,
  client,
}: {
  transaction: IncomingTransactionWithChainId;
  eligibilityQueryData: boolean | undefined;
  eligibilityQueryStatus: 'error' | 'success' | 'loading';
  currency: string;
  origin: string;
  client: Client;
}) {
  const preferences = await getPreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const networksStore = await getNetworksStore();
  const networks = await networksStore.loadNetworksByChainId(
    normalizeChainId(transaction.chainId)
  );
  const chain = networks.getChainById(normalizeChainId(transaction.chainId));
  const network = chain ? networks?.getNetworkByName(chain) || null : null;
  invariant(network, `Unidentified network: ${transaction.chainId}`);
  if (!network.supports_simulations) {
    return null;
  }
  const shouldDoRegularInterpret =
    !network.supports_sponsored_transactions ||
    eligibilityQueryData === false ||
    eligibilityQueryStatus === 'error';

  invariant(transaction.from, 'transaction must have a from value');
  if (shouldDoRegularInterpret) {
    return interpretTransaction({
      address: transaction.from,
      transaction,
      origin,
      currency,
      client,
    });
  } else {
    const toSign = await fetchAndAssignPaymaster(transaction, {
      source,
      apiClient: ZerionAPI,
    });
    const typedData = await walletPort.request('uiGetEip712Transaction', {
      transaction: toSign,
    });
    return interpretSignature({
      address: transaction.from,
      chainId: normalizeChainId(toSign.chainId),
      typedData,
      currency,
      origin,
      client,
    });
  }
}

export function useInterpretTxBasedOnEligibility({
  transaction,
  eligibilityQuery,
  origin,
}: {
  transaction: IncomingTransactionWithChainId;
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
    queryKey: [
      'interpretSignature',
      client,
      currency,
      transaction,
      source,
      origin,
      eligibilityQuery.data?.data.eligible,
      eligibilityQuery.status,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () =>
      interpretTxBasedOnEligibility({
        transaction,
        eligibilityQueryData: eligibilityQuery.data?.data.eligible,
        eligibilityQueryStatus: eligibilityQuery.status,
        currency,
        origin,
        client,
      }),
  });
}
