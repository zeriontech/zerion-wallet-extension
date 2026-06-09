import {
  BUILDER_DEX_ASSET_ID_BASE,
  BUILDER_DEX_ASSET_ID_DEX_STRIDE,
} from '../constants';

export function computeAssetId({
  index,
  dexIndex,
}: {
  index: number;
  dexIndex?: number;
}): number {
  if (dexIndex == null) {
    return index;
  }
  return (
    BUILDER_DEX_ASSET_ID_BASE +
    dexIndex * BUILDER_DEX_ASSET_ID_DEX_STRIDE +
    index
  );
}
