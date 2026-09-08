import { useMemo } from 'react';
import { useReceiverAddressItems } from 'src/ui/components/ReceiverAddressDialog/useReceiverAddressItems';
import type { ReceiverFamiliarity } from './resolveReceiverFamiliarity';
import { resolveReceiverFamiliarity } from './resolveReceiverFamiliarity';

/**
 * Wires {@link resolveReceiverFamiliarity} to the same lists the Receiver
 * picker dialog renders, so "known" here means exactly "the user would have
 * seen this address in the picker" — minus Recents.
 */
export function useReceiverFamiliarity(
  to: string | null | undefined
): ReceiverFamiliarity {
  const { walletItems, watchlistItems, addressBookItems } =
    useReceiverAddressItems();

  return useMemo(
    () =>
      resolveReceiverFamiliarity({
        to,
        myWalletAddresses: walletItems.map((item) => item.address),
        watchlistAddresses: watchlistItems.map((item) => item.address),
        addressBookAddresses: addressBookItems.map((item) => item.address),
      }),
    [to, walletItems, watchlistItems, addressBookItems]
  );
}
