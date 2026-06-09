import { perpClearinghouseState } from './api/requests/perp-clearinghouse-state.client';
import { perpDexs } from './api/requests/perp-dexs.client';

export async function fetchHyperliquidBalance(
  address: string
): Promise<number | null> {
  const dexes = await perpDexs();
  // Main perp DEX (no `dex` param) is always queried, even if perpDexs fails.
  const dexIdentifiers: (string | undefined)[] = [undefined];
  if (dexes) {
    for (const entry of dexes) {
      if (entry?.name) dexIdentifiers.push(entry.name);
    }
  }

  const states = await Promise.all(
    dexIdentifiers.map((dexIdentifier) =>
      perpClearinghouseState({ address, dexIdentifier })
    )
  );

  let total = 0;
  let anyOk = false;
  for (const state of states) {
    if (!state) continue;
    anyOk = true;
    const value = Number(state.marginSummary.accountValue);
    if (Number.isFinite(value)) total += value;
  }
  if (!anyOk) return null;
  return total > 0 ? total : null;
}
