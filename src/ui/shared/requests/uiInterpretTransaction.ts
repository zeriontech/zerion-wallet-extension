import { useQuery } from '@tanstack/react-query';
import {
  interpretSignature,
  interpretTransaction,
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
  transaction,
  eligibilityQueryData,
  eligibilityQueryStatus,
  currency,
  origin,
}: {
  address: string;
  transaction: MultichainTransaction;
  eligibilityQueryData: boolean | undefined;
  eligibilityQueryStatus: 'error' | 'success' | 'loading';
  currency: string;
  origin: string;
}) {
  const preferences = await getPreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const networksStore = await getNetworksStore();
  let network: NetworkConfig | null = null;
  if (transaction.evm) {
    const networks = await networksStore.loadNetworksByChainId(
      normalizeChainId(transaction.evm.chainId)
    );
    const chain = networks.getChainById(
      normalizeChainId(transaction.evm.chainId)
    );
    network = chain ? networks?.getNetworkByName(chain) || null : null;
    invariant(network, `Unidentified network: ${transaction.evm.chainId}`);
  }
  if (transaction.solana) {
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
    return interpretTransaction(
      {
        address,
        chain: network.id,
        transaction,
        origin,
        currency,
      },
      { source }
    );
  } else if (network.supports_sponsored_transactions && eligibilityQueryData) {
    invariant(
      transaction.evm,
      'Only EVM transactions are supported for paymaster'
    );
    const toSign = await fetchAndAssignPaymaster(transaction.evm, {
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
  transaction,
  eligibilityQuery,
  origin,
}: {
  address: string;
  transaction: MultichainTransaction;
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
      transaction,
      source,
      origin,
      eligibilityQuery.data?.data.eligible,
      eligibilityQuery.status,
    ],
    queryFn: () => {
      return interpretTxBasedOnEligibility({
        address,
        transaction: transaction,
        eligibilityQueryData: eligibilityQuery.data?.data.eligible,
        eligibilityQueryStatus: eligibilityQuery.status,
        currency,
        origin,
      });
    },
  });
}
