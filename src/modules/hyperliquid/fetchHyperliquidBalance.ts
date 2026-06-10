import { perpClearinghouseState } from './api/requests/perp-clearinghouse-state.client';
import { perpDexs } from './api/requests/perp-dexs.client';
import { spotClearinghouseState } from './api/requests/spot-clearinghouse-state.client';
import { userAbstraction } from './api/requests/user-abstraction.client';
import { computeEffectiveAccountValueUSD } from './computeEffectiveValues';

export async function fetchHyperliquidBalance(
  address: string
): Promise<number | null> {
  // Fan out the independent queries: perp DEX list, spot balances, and
  // user-abstraction mode. Spot + abstraction are needed to support
  // unified-account users, whose perp `marginSummary.accountValue` is
  // unreliable (often ~0) — the live equity sits in `spot.USDC.total`.
  const [dexes, spotState, abstractionMode] = await Promise.all([
    perpDexs(),
    spotClearinghouseState({ address }),
    userAbstraction({ address }),
  ]);

  // Main perp DEX (no `dex` param) is always queried, even if perpDexs fails.
  const dexIdentifiers: (string | undefined)[] = [undefined];
  if (dexes) {
    for (const entry of dexes) {
      if (entry?.name) dexIdentifiers.push(entry.name);
    }
  }

  const perpStates = await Promise.all(
    dexIdentifiers.map((dexIdentifier) =>
      perpClearinghouseState({ address, dexIdentifier })
    )
  );

  const anyPerpOk = perpStates.some((state) => state != null);
  if (!anyPerpOk) return null;

  const total = computeEffectiveAccountValueUSD({
    perpStates,
    spotBalances: spotState?.balances ?? null,
    abstractionMode: abstractionMode ?? 'disabled',
  });

  return total > 0 ? total : null;
}
