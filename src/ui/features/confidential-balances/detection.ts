import type { AddressPosition } from 'src/defi-sdk.types';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';

export function hasEncryptedPositions(
  positions: Pick<AddressPosition, 'encrypted'>[] | null | undefined
) {
  return Boolean(positions?.some((position) => position.encrypted));
}

export function getEncryptedPositions<
  T extends Pick<AddressPosition, 'encrypted'>
>(positions: T[] | null | undefined): T[] {
  return positions?.filter((position) => position.encrypted) ?? [];
}

export function hasEncryptedTransfers(action: AnyAddressAction) {
  return Boolean(
    action.content?.transfers?.some((transfer) => transfer.amount?.encrypted)
  );
}
