import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { HYPERLIQUID_L1_DOMAIN } from '../constants';
import type { L1Action } from '../actions/types';
import { hashAction } from './hashAction';

export async function buildL1ActionTypedData({
  action,
  nonce,
  expiresAfter,
}: {
  action: L1Action;
  nonce: number;
  expiresAfter?: number;
}): Promise<TypedData> {
  const connectionId = await hashAction({ action, nonce, expiresAfter });
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
    },
    primaryType: 'Agent',
    domain: { ...HYPERLIQUID_L1_DOMAIN },
    message: {
      source: 'a',
      connectionId,
    },
  };
}
