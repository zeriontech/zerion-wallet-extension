import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';

export interface EligibilityQuery {
  data?: null | { data: { eligible: boolean } };
  isError: boolean;
}

/**
 * Checks if a "regular" transaction should be interpreted.
 * Returns `false` if paymaster is eligible. You're supposed to run a separate
 * interpretation for paymaster TypedData in that case
 */
export function shouldInterpretTransaction({
  network,
  eligibilityQuery,
}: {
  network: NetworkConfig | null;
  eligibilityQuery: EligibilityQuery;
}) {
  if (!network?.supports_simulations) {
    return false;
  }
  return network?.supports_sponsored_transactions
    ? eligibilityQuery.data?.data.eligible === false || eligibilityQuery.isError
    : true;
}
