import { client } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { TypedData } from '../message-signing/TypedData';
import type { InterpretResponse } from './types';

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
