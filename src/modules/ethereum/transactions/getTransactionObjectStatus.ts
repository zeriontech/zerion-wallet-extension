import { invariant } from 'src/shared/invariant';
import type { ActionStatus } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { TransactionObject } from './types';

function transactionReceiptToActionStatus(
  transactionObject: Pick<TransactionObject, 'receipt' | 'dropped'>
): ActionStatus {
  return transactionObject.receipt
    ? transactionObject.receipt.status === 1
      ? 'confirmed'
      : 'failed'
    : transactionObject.dropped
    ? 'dropped'
    : 'pending';
}

function solanaTransactionObjectToStatus(
  transactionObject: TransactionObject
): ActionStatus {
  invariant(transactionObject.signature, 'Must be solana tx');
  if (transactionObject.dropped) {
    return 'dropped';
  } else if (transactionObject.signatureStatus == null) {
    return 'pending';
  } else if (transactionObject.signatureStatus.err) {
    return 'failed';
  } else {
    return 'confirmed';
  }
}

function orderObjectToStatus(
  transactionObject: TransactionObject
): ActionStatus {
  invariant(transactionObject.orderId, 'Must be an order');
  switch (transactionObject.orderStatus) {
    case 'successful':
      return 'confirmed';
    case 'failed':
    case 'rejected':
      return 'failed';
    case 'pending':
    default:
      return 'pending';
  }
}

export function getTransactionObjectStatus(
  transactionObject: TransactionObject
): ActionStatus {
  if (transactionObject.orderId) {
    // Orders are never "dropped": they settle or the backend rejects them
    return orderObjectToStatus(transactionObject);
  } else if (transactionObject.signature) {
    return solanaTransactionObjectToStatus(transactionObject);
  } else {
    return transactionReceiptToActionStatus(transactionObject);
  }
}
