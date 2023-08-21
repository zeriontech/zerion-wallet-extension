import { client, createDomainHook } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { TypedData } from '../message-signing/TypedData';
import type { IncomingTransactionWithChainId } from '../types/IncomingTransaction';
import type { InterpretResponse } from './types';
import { getGas } from './getGas';

const namespace = 'interpret';
const scope = 'transaction';

export interface InterpretTransactionPayload {
  address: string;
  currency: string;
  chain_id?: string;
  transaction?: {
    from?: string;
    to?: string;
    nonce?: number;
    chainId?: string;
    gas?: string;
    gasPrice?: string;
    maxFee?: string;
    maxPriorityFee?: string;
    value?: string;
    data?: string;
  };
}

export function interpretTransaction(
  address: string,
  transaction: IncomingTransactionWithChainId
): Promise<InterpretResponse> {
  return Promise.race([
    rejectAfterDelay(10000),
    new Promise<InterpretResponse>((resolve) => {
      let value: InterpretResponse | null = null;

      const unsubscribe = client.subscribe<
        InterpretResponse,
        typeof namespace,
        typeof scope
      >({
        namespace,
        method: 'stream',
        body: {
          scope: [scope],
          payload: {
            address,
            chain_id: transaction.chainId,
            currency: 'usd',
            transaction: {
              from: transaction?.from,
              to: transaction?.to,
              nonce: transaction?.nonce,
              chainId: transaction.chainId,
              gas: getGas(transaction),
              gasPrice: transaction?.gasPrice,
              maxFee: transaction?.maxFeePerGas,
              maxPriorityFee: transaction?.maxPriorityFeePerGas,
              value: transaction?.value,
              data: transaction?.data,
            },
          },
        },
        // Here we're using onMessage instead of onData because of
        // bug in defi-sdk (unsubscribe function is not always returned)
        onMessage: (event, data) => {
          if (event === 'done') {
            resolve(value as InterpretResponse);
            unsubscribe();
            return;
          }
          value = data.payload.transaction;
        },
      });
    }),
  ]);
}

export const useInterpretTransaction = createDomainHook<
  InterpretTransactionPayload,
  InterpretResponse,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});

export function interpretSignature({
  address,
  chainId,
  typedData,
}: {
  address: string;
  chainId?: string | number;
  typedData: TypedData;
}): Promise<InterpretResponse> {
  return Promise.race([
    rejectAfterDelay(10000),
    new Promise<InterpretResponse>((resolve) => {
      let value: InterpretResponse | null = null;

      const unsubscribe = client.subscribe<
        InterpretResponse,
        'interpret',
        'signature'
      >({
        namespace: 'interpret',
        method: 'stream',
        body: {
          scope: ['signature'],
          payload: {
            address,
            chain_id: chainId,
            currency: 'usd',
            typed_data: typedData,
          },
        },
        // Here we're using onMessage instead of onData because of
        // bug in defi-sdk (unsubscribe function is not always returned)
        onMessage: (event, data) => {
          if (event === 'done') {
            resolve(value as InterpretResponse);
            unsubscribe();
            return;
          }
          value = data.payload.signature;
        },
      });
    }),
  ]);
}

export function getInterpretationData(interpretation: InterpretResponse) {
  return interpretation?.inputs?.[0]?.data;
}

export function getInterpretationFunctionSignature(
  interpretation: InterpretResponse
) {
  return interpretation?.inputs?.[0]?.schema?.primary_type;
}
