import type { AddressParams } from 'defi-sdk';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';

interface MultipleAddressesParam {
  addresses: string[];
}

function isMultipleAddressesParam(
  x: AddressParams
): x is MultipleAddressesParam {
  return 'addresses' in x;
}

export function filterAddressTransactions(
  addressParams: AddressParams,
  transactions: TransactionObject[]
) {
  return transactions.filter((tx) => {
    if (!tx.transaction.from) {
      return false;
    }
    if (isMultipleAddressesParam(addressParams)) {
      return addressParams.addresses.includes(tx.transaction.from);
    } else {
      return tx.transaction.from?.toLowerCase() === addressParams.address;
    }
  });
}
