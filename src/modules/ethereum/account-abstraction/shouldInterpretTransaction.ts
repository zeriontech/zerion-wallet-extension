import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';

export interface EligibilityQuery {
  data?: null | { data: { eligible: boolean } };
  isError: boolean;
}

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
