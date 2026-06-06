import type { AddressPosition } from 'defi-sdk';

export enum PositionsGroupType {
  platform = 'platform',
  position = 'position',
}

export const DEFAULT_PROTOCOL_ID = 'wallet';
export const DEFAULT_PROTOCOL_NAME = 'Wallet';
export const DEFAULT_NAME = 'ASSET';

export type AggregatedAddressPosition = AddressPosition & {
  chainDistribution: {
    chain: string;
    quantity: string | null;
    value: string | null;
  }[];
  normalizedQuantity: string;
};

export type AnyAddressPosition = AddressPosition | AggregatedAddressPosition;
