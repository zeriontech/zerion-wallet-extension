import { useQuery } from 'react-query';

export function useFetchIcon(url: string) {
  return useQuery(url, () => fetch(url).then((res) => res.text()));
}
