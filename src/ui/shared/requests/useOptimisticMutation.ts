import { QueryClient, useMutation, useQueryClient } from 'react-query';

export function useOptimisticMutation<Args, Res, QueryType = unknown>(
  mutationFn: (...args: Args[]) => Promise<Res>,
  {
    relatedQueryKey: queryKey,
    onMutate,
  }: {
    relatedQueryKey: string;
    onMutate?: (info: { client: QueryClient; variables: Args }) => unknown;
  }
) {
  type OptimisticContext = { previous?: QueryType };
  const client = useQueryClient();
  return useMutation(mutationFn, {
    onMutate: async (variables): Promise<OptimisticContext> => {
      await client.cancelQueries(queryKey);
      const previous = client.getQueryData<QueryType | undefined>(queryKey);
      onMutate?.({ client, variables });
      return { previous };
    },
    onError: (_err, _args, context) => {
      client.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => client.invalidateQueries(queryKey),
  });
}
