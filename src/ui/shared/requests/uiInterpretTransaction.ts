import { useQuery } from '@tanstack/react-query';
import {
  interpretSignature,
  interpretTransactions,
} from 'src/ui/shared/requests/interpret';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import {
  getPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { fetchAndAssignPaymaster } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { EligibilityQuery } from 'src/ui/components/address-action/EligibilityQuery';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { walletPort } from '../channels';

/**
 * Interprets Paymaster Transaction if it is eligible
 * or a regular transaction otherwise
 */
export async function interpretTxBasedOnEligibility({
  address,
  transactions,
  eligibilityQueryData,
  eligibilityQueryStatus,
  currency,
  origin,
}: {
  address: string;
  transactions: MultichainTransaction[];
  eligibilityQueryData: boolean | undefined;
  eligibilityQueryStatus: 'error' | 'success' | 'loading';
  currency: string;
  origin: string;
}) {
  const preferences = await getPreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const networksStore = await getNetworksStore();
  let network: NetworkConfig | null = null;
  if (transactions[0].evm) {
    const networks = await networksStore.loadNetworksByChainId(
      normalizeChainId(transactions[0].evm.chainId)
    );
    const chain = networks.getChainById(
      normalizeChainId(transactions[0].evm.chainId)
    );
    network = chain ? networks?.getNetworkByName(chain) || null : null;
    invariant(network, `Unidentified network: ${transactions[0].evm.chainId}`);
  }
  if (transactions[0].solana) {
    network = await networksStore.fetchNetworkById(NetworkId.Solana);
  }
  invariant(network, 'Network must be defined for transaction interpretation');
  if (!network.supports_simulations) {
    return null;
  }
  const shouldDoRegularInterpret =
    !network.supports_sponsored_transactions ||
    eligibilityQueryData === false ||
    eligibilityQueryStatus === 'error';

  if (shouldDoRegularInterpret) {
    return interpretTransactions(
      {
        address,
        chain: network.id,
        transactions,
        origin,
        currency,
      },
      { source }
    );
  } else if (network.supports_sponsored_transactions && eligibilityQueryData) {
    invariant(
      transactions[0].evm,
      'Only EVM transactions are supported for paymaster'
    );
    const toSign = await fetchAndAssignPaymaster(transactions[0].evm, {
      source,
      apiClient: ZerionAPI,
    });
    const typedData = await walletPort.request('uiGetEip712Transaction', {
      transaction: toSign,
    });
    return interpretSignature(
      {
        address,
        chain: network.id,
        typedData,
        currency,
        origin,
      },
      { source }
    );
  } else {
    return null;
  }
}

export function useInterpretTxBasedOnEligibility({
  address,
  transactions,
  eligibilityQuery,
  origin,
}: {
  address: string;
  transactions: MultichainTransaction[];
  eligibilityQuery: EligibilityQuery;
  origin: string;
}) {
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
      'interpretSignature',
      address,
      currency,
      transactions,
      source,
      origin,
      eligibilityQuery.data?.data.eligible,
      eligibilityQuery.status,
    ],
    queryFn: () => {
      return interpretTxBasedOnEligibility({
        address,
        transactions,
        eligibilityQueryData: eligibilityQuery.data?.data.eligible,
        eligibilityQueryStatus: eligibilityQuery.status,
        currency,
        origin,
      });
    },
  });
}
