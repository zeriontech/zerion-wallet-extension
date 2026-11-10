import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useOptimisticMutation<Args, Res, QueryType = unknown>(
  mutationFn: (variables: Args) => Promise<Res>,
  {
    relatedQueryKey: queryKey,
    onMutate,
  }: {
    relatedQueryKey: QueryKey;
    onMutate?: (info: { client: QueryClient; variables: Args }) => unknown;
  },
) {
  type OptimisticContext = { previous?: QueryType };
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (variables): Promise<OptimisticContext> => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<QueryType | undefined>(queryKey);
      onMutate?.({ client, variables });
      return { previous };
    },
    onError: (_err, _args, context: OptimisticContext | undefined) => {
      client.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
}
