import { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';

function tryGetEcosystem(
  network: NetworkConfig | null | undefined
): BlockchainType | null {
  if (!network) return null;
  try {
    return Networks.getEcosystem(network);
  } catch {
    return null;
  }
}

function tryGetAddressEcosystem(
  address: string | null | undefined
): BlockchainType | null {
  if (!address) return null;
  if (isEthereumAddress(address)) return 'evm';
  if (isSolanaAddress(address)) return 'solana';
  return null;
}

export interface CrossEcosystemState {
  /** True only when both ecosystems are positively classified and differ. */
  isCrossEcosystem: boolean;
  /**
   * True only inside a Cross-ecosystem swap, when `to` is set, classifiable,
   * and its ecosystem differs from the output network's ecosystem.
   */
  receiverEcosystemMismatch: boolean;
  /**
   * Output network's ecosystem when known (whether or not cross-ecosystem).
   * Useful for warning copy and quote-gating logic.
   */
  outputEcosystem: BlockchainType | null;
}

/**
 * Pure helper that classifies the form's ecosystem state.
 *
 * Fails open: when either side can't be classified (unknown network /
 * unrecognized address), the form behaves as if same-ecosystem — no special
 * gating, no mismatch warning. The backend remains the final authority.
 */
export function getCrossEcosystemState({
  inputNetwork,
  outputNetwork,
  to,
}: {
  inputNetwork: NetworkConfig | null | undefined;
  outputNetwork: NetworkConfig | null | undefined;
  to: string | null | undefined;
}): CrossEcosystemState {
  const inputEcosystem = tryGetEcosystem(inputNetwork);
  const outputEcosystem = tryGetEcosystem(outputNetwork);

  const isCrossEcosystem =
    inputEcosystem != null &&
    outputEcosystem != null &&
    inputEcosystem !== outputEcosystem;

  let receiverEcosystemMismatch = false;
  if (isCrossEcosystem && to && outputEcosystem) {
    const toEcosystem = tryGetAddressEcosystem(to);
    if (toEcosystem != null && toEcosystem !== outputEcosystem) {
      receiverEcosystemMismatch = true;
    }
  }

  return { isCrossEcosystem, receiverEcosystemMismatch, outputEcosystem };
}

/**
 * Whether the cross-ecosystem `to` is usable for a quote request.
 *
 * Inside a Cross-ecosystem swap, `to` must be both present and classifiable
 * as the output ecosystem. Unknown classifications block quote fetching
 * (treated like a mismatch for gating), even though they don't surface a
 * mismatch warning.
 */
export function isReceiverReadyForQuote({
  isCrossEcosystem,
  outputEcosystem,
  to,
}: {
  isCrossEcosystem: boolean;
  outputEcosystem: BlockchainType | null;
  to: string | null | undefined;
}): boolean {
  if (!isCrossEcosystem) return true;
  if (!to) return false;
  const toEcosystem = tryGetAddressEcosystem(to);
  return toEcosystem != null && toEcosystem === outputEcosystem;
}
