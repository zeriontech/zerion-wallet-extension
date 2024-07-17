export function updateSearchParam(key: string, value: string) {
  return (prev: URLSearchParams) => {
    const newParams = new URLSearchParams(prev);
    newParams.set(key, value);
    return newParams;
  };
}
