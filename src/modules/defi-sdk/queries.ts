import type { Asset } from 'defi-sdk';
import { backgroundCache } from './index';

export function queryCacheForAsset(assetCode: string) {
  const normalizedCode = assetCode.toLowerCase();
  for (const entry of backgroundCache.map.values()) {
    if (entry.state.value?.positions?.length) {
      for (const position of entry.state.value.positions) {
        if (
          Object.values(position.asset.implementations).some(
            (impl: unknown) =>
              (impl as { address: string }).address === normalizedCode
          )
        ) {
          return position.asset as Asset;
        }
      }
    }
  }
}
