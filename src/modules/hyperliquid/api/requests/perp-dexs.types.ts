export interface PerpDexInfo {
  name: string;
  full_name: string;
  deployer: string;
  oracle_updater: string | null;
}

// Index 0 is the main perp DEX and is always `null`. Each subsequent entry
// is a builder-deployed perp DEX whose `name` is the `dex` parameter used by
// `clearinghouseState` / `metaAndAssetCtxs` requests.
export type PerpDexsResponse = (PerpDexInfo | null)[];

// `undefined` represents the main perp DEX (no `dex` query param);
// strings are builder-deployed DEX names.
export type DexIdentifier = string | undefined;
