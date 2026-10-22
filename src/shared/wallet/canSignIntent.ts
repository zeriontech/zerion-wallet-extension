import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { BlockchainType } from 'src/shared/wallet/classifiers';

/** Intent quotes stay unreachable until they can be signed (WLT-3106) */
export function canSignIntent(
  _wallet: ExternallyOwnedAccount | null,
  _ecosystem: BlockchainType
): boolean {
  return false;
}
