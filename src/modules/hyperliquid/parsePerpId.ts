export interface ParsedPerpId {
  coin: string;
  dexIdentifier?: string;
}

// `coin` here is the FULL Hyperliquid universe identifier (e.g. `BTC` on the
// main perp DEX, `xyz:NVDA` on the `xyz` builder DEX). Hyperliquid's API and
// `userFills` / `clearinghouseState` responses all reference assets by this
// full name, so we keep it intact and only split out `dexIdentifier` for the
// `dex` request parameter.
export function parsePerpId(raw: string): ParsedPerpId {
  const idx = raw.indexOf(':');
  if (idx === -1) {
    return { coin: raw };
  }
  return {
    dexIdentifier: raw.slice(0, idx),
    coin: raw,
  };
}

export function getPerpDisplayName(coin: string): string {
  const idx = coin.indexOf(':');
  return idx === -1 ? coin : coin.slice(idx + 1);
}

export function stringifyPerpId(parsed: ParsedPerpId): string {
  return parsed.coin;
}
