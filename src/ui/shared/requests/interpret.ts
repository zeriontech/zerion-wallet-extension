import { valueToHex } from 'src/shared/units/valueToHex';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { BackendSourceParams } from 'src/modules/zerion-api/shared';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { invariant } from 'src/shared/invariant';
import type { TransactionEVM } from 'src/shared/types/Quote';
import type { TypedData } from '../../../modules/ethereum/message-signing/TypedData';
import { getGas } from '../../../modules/ethereum/transactions/getGas';

export function interpretTransaction(
  {
    address,
    chain,
    transaction,
    origin,
    currency,
  }: {
    address: string;
    chain: string;
    transaction: MultichainTransaction;
    origin: string;
    currency: string;
  },
  { source }: BackendSourceParams
): Promise<InterpretResponse | null> {
  let normalizedEvmTx: TransactionEVM | undefined = undefined;
  if (transaction.evm) {
    invariant(
      transaction.evm.nonce,
      'EVM transaction nonce is required for simulation'
    );
    invariant(
      transaction.evm.from,
      'EVM transaction from is required for simulation'
    );
    invariant(
      transaction.evm.to,
      'EVM transaction to is required for simulation'
    );
    const gas = getGas(transaction.evm);
    invariant(gas, 'EVM transaction gas is required for simulation');
    normalizedEvmTx = {
      ...transaction.evm,
      from: transaction.evm.from,
      to: transaction.evm.to,
      gas: valueToHex(gas),
      gasPrice:
        transaction.evm.gasPrice != null
          ? valueToHex(transaction.evm.gasPrice)
          : null,
      chainId: valueToHex(transaction.evm.chainId),
      type:
        transaction.evm.type != null ? valueToHex(transaction.evm.type) : '0x2',
      nonce: valueToHex(transaction.evm.nonce),
      maxFee:
        transaction.evm.maxFeePerGas != null
          ? valueToHex(transaction.evm.maxFeePerGas)
          : null,
      maxPriorityFee:
        transaction.evm.maxPriorityFeePerGas != null
          ? valueToHex(transaction.evm.maxPriorityFeePerGas)
          : null,
      value:
        transaction.evm.value != null
          ? valueToHex(transaction.evm.value)
          : '0x0',
      data: transaction.evm.data != null ? transaction.evm.data : '0x',
      customData: transaction.evm.customData || null,
    };
  }
  return ZerionAPI.walletSimulateTransaction(
    {
      address,
      chain,
      currency,
      domain: origin,
      transaction: {
        evm: normalizedEvmTx,
        solana: transaction.solana,
      },
    },
    { source }
  );
}

export function interpretSignature(
  {
    address,
    chain,
    typedData,
    currency,
    origin,
  }: {
    address: string;
    chain: string;
    typedData: TypedData;
    currency: string;
    origin: string;
  },
  { source }: BackendSourceParams
): Promise<SignatureInterpretResponse> {
  return ZerionAPI.walletSimulateSignature(
    {
      address,
      chain,
      currency,
      domain: origin,
      signature: { typedData },
    },
    { source }
  );
}
