import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { fetchHyperliquidBalance } from 'src/modules/hyperliquid/fetchHyperliquidBalance';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import {
  getConfidentialPermits,
  useConfidentialPermits,
} from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import { getPermitsFingerprint } from 'src/shared/confidential-balances/permits';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-portfolio';
import type { SignedPermit } from '../requests/wallet-prepare-permits';
import type { BackendSourceParams } from '../shared';

const STALE_TIME = 20000;
const QUERY_KEY = 'walletGetPortfolio';

function queryFn(
  params: Params,
  clientParams: BackendSourceParams,
  permits: SignedPermit[]
) {
  return withPermits(permits, (permits) =>
    ZerionAPI.walletGetPortfolio({ ...params, permits }, clientParams)
  );
}

export async function queryWalletPortfolio(
  params: Params,
  clientParams: BackendSourceParams
) {
  const permits = await getConfidentialPermits(params.addresses);
  return queryClient.fetchQuery({
    queryKey: persistentQuery([
      QUERY_KEY,
      params,
      clientParams,
      getPermitsFingerprint(permits),
    ]),
    queryFn: () => queryFn(params, clientParams, permits),
    staleTime: STALE_TIME,
  });
}

export function useWalletPortfolio(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
    keepPreviousData = false,
    refetchInterval,
    refetchOnWindowFocus = true,
    hyperliquidDelayMs = 0,
    hyperliquidRefetchOnWindowFocus = refetchOnWindowFocus,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    /**
     * Delay before the per-wallet Hyperliquid balance request is allowed to
     * fire. Used by wallet-list surfaces to stagger the per-row HL requests
     * (e.g. `index * 300ms`) so N wallets don't hit the HL API at once.
     */
    hyperliquidDelayMs?: number;
    /**
     * Lets wallet-list surfaces opt the HL balance request out of
     * window-focus refetching independently of the main portfolio query.
     */
    hyperliquidRefetchOnWindowFocus?: boolean;
  } = {}
) {
  // Signed Permits make confidential amounts count towards the total, so
  // their fingerprint is part of the key: a new permit refetches the portfolio
  const { permits, fingerprint, isReady } = useConfidentialPermits(
    params.addresses
  );
  const portfolioQuery = useQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: persistentQuery([QUERY_KEY, params, source, fingerprint]),
    queryFn: () => queryFn(params, { source }, permits),
    retry: 0, // if not 0, there are too many rerenders if the queryFn throws synchronously
    suspense,
    enabled: enabled && isReady,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus,
  });

  const address = params.addresses[0] ?? '';
  const isEvmAddress = address && getAddressType(address) === 'evm';

  // Stagger per-wallet HL requests: when a delay is configured, keep the query
  // disabled until it elapses (`useRenderDelay` flips to `true` after the
  // delay), so a list of wallets doesn't fire all of its Hyperliquid requests
  // on mount. When no delay is set (default `0`), `delayElapsed` is ignored so
  // the request still fires on first render — no behavior change off the
  // wallet list.
  const delayElapsed = useRenderDelay(hyperliquidDelayMs);
  const hyperliquidArmed = hyperliquidDelayMs <= 0 || delayElapsed;

  const hyperliquidQuery = useQuery({
    queryKey: ['hyperliquidBalance', address],
    queryFn: () => fetchHyperliquidBalance(address),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && isEvmAddress && hyperliquidArmed),
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus: hyperliquidRefetchOnWindowFocus,
  });

  const hyperliquidBalance = hyperliquidQuery.data ?? null;

  const data = useMemo(() => {
    const portfolioData = portfolioQuery.data;
    if (!portfolioData || hyperliquidBalance == null) {
      return portfolioData;
    }
    return {
      ...portfolioData,
      data: {
        ...portfolioData.data,
        totalValue: portfolioData.data.totalValue + hyperliquidBalance,
      },
    };
  }, [portfolioQuery.data, hyperliquidBalance]);

  return {
    ...portfolioQuery,
    data,
    hyperliquidBalance,
  };
}
