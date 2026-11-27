import { useQueries, useQuery } from '@tanstack/react-query';
import { perpApprovedBuilders } from '../api/requests/perp-approved-builders.client';
import { perpMaxBuilderFee } from '../api/requests/perp-max-builder-fee.client';

export interface ApprovedBuilder {
  builder: string;
  /** Max approved fee in Hyperliquid builder-fee units (denominator 100_000). */
  maxFeeUnits: number | null;
}

export function useApprovedBuilders({
  address,
  enabled = true,
}: {
  address: string | null | undefined;
  enabled?: boolean;
}) {
  const buildersQuery = useQuery({
    queryKey: ['hyperliquid/approvedBuilders', address],
    queryFn: () => perpApprovedBuilders({ address: address as string }),
    enabled: enabled && Boolean(address),
    staleTime: 30_000,
    retry: 1,
  });

  const builders = buildersQuery.data ?? [];
  const feeQueries = useQueries({
    queries: builders.map((builder) => ({
      queryKey: ['hyperliquid/maxBuilderFee', address, builder],
      queryFn: () => perpMaxBuilderFee({ address: address as string, builder }),
      staleTime: 30_000,
      retry: 1,
    })),
  });

  const approvals: ApprovedBuilder[] = builders.map((builder, index) => {
    const value = feeQueries[index]?.data;
    return {
      builder,
      maxFeeUnits: typeof value === 'number' && Number.isFinite(value) ? value : null,
    };
  });

  return {
    approvals,
    isLoading: buildersQuery.isLoading || feeQueries.some((query) => query.isLoading),
    isError: buildersQuery.isError,
    isEmpty: buildersQuery.isSuccess && builders.length === 0,
    refetch: buildersQuery.refetch,
  };
}
