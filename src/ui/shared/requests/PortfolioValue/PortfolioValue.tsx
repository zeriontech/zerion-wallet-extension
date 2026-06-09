import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { normalizeAddress } from 'src/shared/normalizeAddress';

/**
 * Step (ms) between staggered per-wallet Hyperliquid requests in a list.
 * `delay = listIndex * HYPERLIQUID_STAGGER_STEP_MS`.
 */
const HYPERLIQUID_STAGGER_STEP_MS = 1000;

export function PortfolioValue({
  address,
  enabled = true,
  listIndex,
  staggerHyperliquid = false,
  render,
}: {
  address: string;
  enabled?: boolean;
  /**
   * Position of this row in a wallet list. When `staggerHyperliquid` is on,
   * it spreads the per-wallet HL requests by `listIndex * 300ms`.
   */
  listIndex?: number;
  /**
   * Opt-in for wallet-list surfaces: stagger the per-wallet HL request and
   * skip window-focus refetching for it. Other surfaces keep the default
   * (immediate, focus-refetching) behavior.
   */
  staggerHyperliquid?: boolean;
  render: (value: ReturnType<typeof useWalletPortfolio>) => JSX.Element;
}) {
  const { currency } = useCurrency();
  const query = useWalletPortfolio(
    { addresses: [normalizeAddress(address)], currency },
    { source: useHttpClientSource() },
    {
      enabled,
      hyperliquidDelayMs: staggerHyperliquid
        ? (listIndex ?? 0) * HYPERLIQUID_STAGGER_STEP_MS
        : 0,
      // Only override focus-refetch for staggered lists; otherwise leave it to
      // the hook default (mirrors the main portfolio query's behavior).
      ...(staggerHyperliquid
        ? { hyperliquidRefetchOnWindowFocus: false }
        : null),
    }
  );
  return render(query);
}
