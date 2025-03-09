import type { AddressPosition } from 'defi-sdk';

/**
 * satisfies AddressPosition | EmptyAddressPosition
 * EmptyAddressPosition is a type from @zeriontech/transactions
 */
export type BareAddressPosition = Pick<
  AddressPosition,
  'id' | 'asset' | 'quantity' | 'chain'
>;
