import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { valueToHex } from 'src/shared/units/valueToHex';
import { GAS_PER_PUBDATA_BYTE_DEFAULT } from 'src/modules/ethereum/account-abstraction/constants';
import { ZerionHttpClient } from '../shared';
import type { ClientOptions } from '../shared';
import type { ResponseBody } from './ResponseBody';

type HexString = string;

interface PaymasterEligibilityParams {
  transaction: {
    from: HexString;
    to: HexString;
    nonce: HexString;
    chainId: HexString;
    gas: HexString;
    gasPerPubdataByte: HexString;
    value: HexString;
    data: HexString;
  };
}

type Keys = keyof PaymasterEligibilityParams['transaction'];
type PaymasterEligibilityParamsAdapted = Required<
  Pick<
    IncomingTransaction,
    Exclude<Keys, 'gasPerPubdataByte' | 'value' | 'data'>
  >
> &
  Pick<IncomingTransaction, 'value' | 'data'> & {
    gasPerPubdataByte?: string;
  };

type PaymasterEligibilityResponse = ResponseBody<{
  eligible: boolean;
  eta: null | number;
}>;

export function paymasterCheckEligibility(
  tx: PaymasterEligibilityParamsAdapted,
  options?: ClientOptions
) {
  const {
    from,
    to,
    nonce,
    value = '0x0',
    chainId,
    data = '0x0',
    gas,
    gasPerPubdataByte = GAS_PER_PUBDATA_BYTE_DEFAULT,
  } = tx;
  const params: PaymasterEligibilityParams = {
    transaction: {
      from,
      to,
      chainId: normalizeChainId(chainId),
      nonce: valueToHex(nonce),
      value: valueToHex(value),
      data: valueToHex(data),
      gas: valueToHex(gas),
      gasPerPubdataByte,
    },
  };
  const endpoint = '/paymaster/check-eligibility/v2';
  return ZerionHttpClient.post<PaymasterEligibilityResponse>({
    endpoint,
    body: JSON.stringify(params),
    ...options,
  });
}

interface PaymasterParamsRequest {
  transaction: {
    from: HexString;
    to: HexString;
    nonce: HexString;
    chainId: HexString;
    gas: HexString;
    gasPerPubdataByte: HexString;
    maxFee: HexString;
    maxPriorityFee: HexString;
    value: HexString;
    data: HexString;
  };
}

type PaymasterParamsResponse = ResponseBody<{
  eligible: boolean;
  paymasterParams: {
    paymaster: string;
    paymasterInput: string;
  };
}>;

type PartiallyOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export function getPaymasterParams(
  requestAdapted: {
    transaction: PartiallyOptional<
      PaymasterParamsRequest['transaction'],
      'value' | 'data'
    >;
  },
  options?: ClientOptions
) {
  const { transaction } = requestAdapted;
  const params: PaymasterParamsRequest = {
    transaction: {
      value: transaction.value ?? '0x0',
      data: transaction.data ?? '0x0',
      from: transaction.from,
      to: transaction.to,
      nonce: transaction.nonce,
      chainId: transaction.chainId,
      gas: transaction.gas,
      gasPerPubdataByte: transaction.gasPerPubdataByte,
      maxFee: transaction.maxFee,
      maxPriorityFee: transaction.maxPriorityFee,
    },
  };
  const endpoint = '/paymaster/get-params/v2';
  return ZerionHttpClient.post<PaymasterParamsResponse>({
    endpoint,
    body: JSON.stringify(params),
    ...options,
  });
}
