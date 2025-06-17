import { type Client, client as defaultClient } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { Chain } from 'src/modules/networks/Chain';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { TypedData } from '../message-signing/TypedData';
import type { InterpretResponse } from './types';
import { getGas } from './getGas';
import type { ChainId } from './ChainId';

export function interpretTransaction({
  address,
  chain,
  transaction,
  origin,
  client = defaultClient,
  currency,
}: {
  address: string;
  chain: Chain;
  transaction: MultichainTransaction;
  origin: string;
  client?: Client;
  currency: string;
}): Promise<InterpretResponse> {
  return Promise.race([
    rejectAfterDelay(10000, 'interpret transaction'),
    new Promise<InterpretResponse>((resolve) => {
      let value: InterpretResponse | null = null;

      let normalizedEvmTx;
      if (transaction.evm) {
        normalizedEvmTx = {
          ...transaction.evm,
          maxFee: transaction.evm.maxFeePerGas,
          maxPriorityFee: transaction.evm.maxPriorityFeePerGas,
        };
        const gas = getGas(transaction.evm);
        if (gas != null) {
          normalizedEvmTx.gas = valueToHex(gas);
        }
        if (normalizedEvmTx.value != null) {
          normalizedEvmTx.value = valueToHex(normalizedEvmTx.value);
        }
      }
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
            chain: chain.toString(),
            currency,
            transaction: normalizedEvmTx,
            solanaTransaction: transaction.solana,
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
  origin,
}: {
  address: string;
  chainId?: ChainId | null;
  typedData: TypedData;
  client?: Client;
  currency: string;
  origin: string;
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
