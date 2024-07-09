import { type Client, client as defaultClient } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { TypedData } from '../message-signing/TypedData';
import type { IncomingTransactionWithChainId } from '../types/IncomingTransaction';
import type { InterpretResponse } from './types';
import { getGas } from './getGas';
import type { ChainId } from './ChainId';

export function interpretTransaction({
  address,
  transaction,
  origin,
  client = defaultClient,
  currency,
}: {
  address: string;
  transaction: IncomingTransactionWithChainId;
  origin: string;
  client?: Client;
  currency: string;
}): Promise<InterpretResponse> {
  const gas = getGas(transaction);
  return Promise.race([
    rejectAfterDelay(10000, 'interpret transaction'),
    new Promise<InterpretResponse>((resolve) => {
      let value: InterpretResponse | null = null;

      const unsubscribe = client.subscribe<
        InterpretResponse,
        'interpret',
        'transaction'
      >({
        namespace: 'interpret',
        method: 'stream',
        body: {
          scope: ['transaction'],
          payload: {
            address,
            chain_id: transaction.chainId,
            currency,
            transaction: {
              from: transaction.from,
              to: transaction.to,
              nonce: transaction.nonce,
              chainId: transaction.chainId,
              gas: gas != null ? valueToHex(gas) : null,
              gasPrice: transaction.gasPrice,
              maxFee: transaction.maxFeePerGas,
              maxPriorityFee: transaction.maxPriorityFeePerGas,
              value: transaction.value ? valueToHex(transaction.value) : '0x0',
              data: transaction.data,
            },
            domain: origin,
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

export function interpretSignature({
  address,
  chainId,
  typedData,
  client = defaultClient,
  currency,
}: {
  address: string;
  chainId?: ChainId | null;
  typedData: TypedData;
  client?: Client;
  currency: string;
}): Promise<InterpretResponse> {
  return Promise.race([
    rejectAfterDelay(10000, 'interpret signature'),
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
            currency,
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

export function getInterpretationFunctionName(
  interpretation: InterpretResponse
) {
  return interpretation.input?.sections[0]?.blocks.find(
    ({ name }) => name === 'Function Name'
  )?.value;
}
