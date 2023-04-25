import { client } from 'defi-sdk';
import type { AddressAction } from 'defi-sdk';
import type { IncomingTransactionWithChainId } from '../types/IncomingTransaction';

interface Warning {
  severity: string;
  message: string;
}

interface Field {
  name: string;
  type: string;
}

interface Schema {
  primary_type: string;
  types: Record<string, Field[]>;
}

interface Input {
  data: string;
  schema: Schema;
}

interface InterpretResponse {
  action: AddressAction;
  input: Input[];
  warnings: Warning[];
}

export function interpretTransaction(
  address: string,
  transaction: IncomingTransactionWithChainId
): Promise<InterpretResponse> {
  return new Promise((resolve) => {
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
          currency: 'usd',
          transaction: {
            from: transaction?.from,
            to: transaction?.to,
            nonce: transaction?.nonce,
            chainId: transaction.chainId,
            gas: transaction?.gas,
            gasPrice: transaction?.gasPrice,
            maxFee: transaction?.maxFeePerGas,
            maxPriorityFee: transaction?.maxPriorityFeePerGas,
            value: transaction?.value,
            data: transaction?.data,
          },
        },
      },
      onMessage: (event, data) => {
        if (event === 'done') {
          resolve(value as InterpretResponse);
          unsubscribe();
          return;
        }
        value = data.payload.transaction;
      },
      // onData: (data) => {
      //   const { value, isDone } = data;
      //   if (isDone && value) {
      //     resolve(value);
      //     x.unsubscribe();
      //   }
      // },
      // mergeStrategy: mergeSingleEntity,
    });
  });
}
