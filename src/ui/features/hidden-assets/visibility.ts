import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { AssetVisibilityChangedParams } from 'src/shared/types/asset-events';
import { emitter } from 'src/ui/shared/events';

/** Fire-and-forget: reporting spam must never block or fail the hide. */
export function reportAssetSpam(assetId: string, walletAddress?: string) {
  void ZerionAPI.assetReportSpam({
    assetId,
    ...(walletAddress ? { wallet: walletAddress } : null),
  }).catch(() => {
    // Hiding succeeded; the report is best-effort.
  });
}

export function trackAssetVisibilityChanged(params: AssetVisibilityChangedParams) {
  emitter.emit('assetVisibilityChanged', params);
}
