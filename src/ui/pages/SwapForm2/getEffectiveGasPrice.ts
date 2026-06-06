/**
 * The "effective" gas price a transaction is expected to pay, in wei.
 *
 * - Legacy (type 0/1): the flat `gasPrice`.
 * - EIP-1559 (type 2): `min(maxFee, baseFee + maxPriorityFee)` — the fee the
 *   network would actually charge given the current base fee. The base fee is
 *   not part of the quote, so callers pass the current one from
 *   `chain/get-gas-price` (`gasPrices.fast.eip1559.baseFee`).
 *
 * All inputs and the result are in wei. Returns `null` when there isn't enough
 * information to compute a price (e.g. an EIP-1559 tx with no base fee and no
 * maxFee, or a tx with no price fields at all).
 */
export function getEffectiveGasPrice(
  {
    gasPrice,
    maxFee,
    maxPriorityFee,
  }: {
    gasPrice?: number | null;
    maxFee?: number | null;
    maxPriorityFee?: number | null;
  },
  baseFee?: number | null
): number | null {
  const is1559 = maxFee != null || maxPriorityFee != null;
  if (is1559) {
    const priority = maxPriorityFee ?? 0;
    const cappedByMaxFee = maxFee ?? Infinity;
    if (baseFee != null) {
      const computed = baseFee + priority;
      const effective = Math.min(cappedByMaxFee, computed);
      return Number.isFinite(effective) ? effective : null;
    }
    // No current base fee available: fall back to maxFee (its absolute cap) so
    // the ratio still "conveys scale".
    return maxFee ?? null;
  }
  if (gasPrice != null) {
    return gasPrice;
  }
  return null;
}
