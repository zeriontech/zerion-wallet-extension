import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';

/** iOS parity: unverified assets below this liquidity are treated as spam. */
export const SPAM_LIQUIDITY_LIMIT = 10_000;

/**
 * iOS `Fungible.FullInfo.isLikelySpam`: verified assets are never spam, and an
 * unverified asset is spam when it is new or has little/no liquidity.
 */
export function isLikelySpam(fullInfo: AssetFullInfo): boolean {
  return (
    !fullInfo.fungible.verified &&
    (fullInfo.fungible.new || (fullInfo.extra.liquidity ?? 0) < SPAM_LIQUIDITY_LIMIT)
  );
}

/**
 * The hint is device-wide and one-time: it only appears for a likely-spam asset
 * while nothing is hidden yet, and never on an already hidden asset.
 */
export function shouldShowHideTokenHint({
  fullInfo,
  hiddenFungibleIds,
  hiddenListReady,
  hasSeenHint,
  isHidden,
}: {
  fullInfo: AssetFullInfo | undefined;
  hiddenFungibleIds: readonly string[];
  /** The stored list must be loaded: an unknown list is not an empty one. */
  hiddenListReady: boolean;
  hasSeenHint: boolean;
  isHidden: boolean;
}): boolean {
  return Boolean(
    fullInfo &&
    hiddenListReady &&
    !hasSeenHint &&
    !isHidden &&
    hiddenFungibleIds.length === 0 &&
    isLikelySpam(fullInfo),
  );
}
