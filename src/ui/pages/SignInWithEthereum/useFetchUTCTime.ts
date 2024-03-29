import { useQuery } from '@tanstack/react-query';

export function useFetchUTCTime() {
  return useQuery({
    queryKey: ['utcTime'],
    queryFn: async () => {
      const text = await fetch('https://proxy.zerion.io/utc-time').then((res) =>
        res.text()
      );
      return Number(text);
    },
    suspense: false,
    retry: false,
  });
}
