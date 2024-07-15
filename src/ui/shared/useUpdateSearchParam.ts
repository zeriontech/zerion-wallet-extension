import type { SetURLSearchParams } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

type UpdateSearchParam = (
  key: string,
  value: string,
  navigateOptions?: Parameters<SetURLSearchParams>[1]
) => void;

export function useUpdateSearchParam(): [URLSearchParams, UpdateSearchParam] {
  const [params, setSearchParams] = useSearchParams();
  const updateSearchParam = (
    key: string,
    value: string,
    navigateOptions?: Parameters<typeof setSearchParams>[1]
  ) => {
    const newParams = new URLSearchParams(params);
    newParams.set(key, value);
    setSearchParams(newParams, navigateOptions);
  };

  return [params, updateSearchParam];
}
