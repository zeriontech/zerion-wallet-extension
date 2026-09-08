import type { AddressPosition } from 'src/defi-sdk.types';

/**
 * A position the wallet does not hold yet (quantity `'0'`), enough to build a
 * send transaction for the asset. Inlined from `@zeriontech/transactions`
 * (WLT-2470), where it was a class; the extension only ever reads it.
 */
export type EmptyAddressPosition = Pick<
  AddressPosition,
  'asset' | 'quantity' | 'chain' | 'id'
>;
