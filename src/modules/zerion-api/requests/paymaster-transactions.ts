import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { valueToHex } from 'src/shared/units/valueToHex';
import { ZerionHttpClient } from '../shared';
import type { BackendSourceParams } from '../shared';

type PaymasterEligibilityPayload = PartiallyRequired<
  Pick<IncomingTransaction, 'chainId' | 'from' | 'nonce'>,
  'chainId' | 'from'
>;

interface PaymasterEligibilityResponse {
  data: { eligible: boolean; eta: null | number };
  errors?: null | { title: string; detail: string }[];
}

export function checkPaymasterEligibility(
  tx: PaymasterEligibilityPayload,
  { source }: BackendSourceParams
) {
  const { nonce, chainId, from } = tx;
  invariant(nonce != null, 'Nonce is required to check eligibility');
  const params = new URLSearchParams({
    from,
    chainId: normalizeChainId(chainId),
    nonce: valueToHex(nonce),
    backend_env: 'zero',
  });
  const endpoint = `paymaster/check-eligibility/v1?${params}`;
  return ZerionHttpClient.get<PaymasterEligibilityResponse>({
    endpoint,
    source,
  });
}

export function getPaymasterParams(
  request: {
    from: string;
    to: string;
    nonce: string;
    chainId: string;
    gas: string;
    gasPerPubdataByte: string;
    maxFee: string;
    maxPriorityFee: string;
    value: string;
    data: string;
  },
  { source }: BackendSourceParams
) {
  interface PaymasterParamsResponse {
    data: {
      eligible: boolean;
      paymasterParams: {
        paymaster: string;
        paymasterInput: string;
      };
      chargesData: {
        amount: number;
        deadline: string;
        eta: null;
      };
    };
    errors?: null | { title: string; detail: string }[];
  }
  const params = new URLSearchParams(request);
  const endpoint = `/paymaster/get-params/v1?${params}`;
  return ZerionHttpClient.get<PaymasterParamsResponse>({ endpoint, source });
}
