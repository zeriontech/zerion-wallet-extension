function mergeSearchParams(a: URLSearchParams, b: URLSearchParams) {
  for (const [name, value] of b.entries()) {
    a.append(name, value);
  }
  return a;
}

export function createUrl({
  base,
  pathname,
  searchParams,
}: {
  base: string | URL;
  pathname: string;
  searchParams?: ConstructorParameters<typeof URLSearchParams>[0];
}) {
  // {baseUrl} preserves searchParams from base
  const baseUrl = new URL(base);

  // {pathnameUrl} correctly concats pathname from base with pathname from options
  // and preserves searchParams from pathname
  const pathnameUrl = pathname ? new URL(pathname, base) : null;

  // set correct pathname to {baseUrl}
  if (pathnameUrl) {
    baseUrl.pathname = pathnameUrl.pathname;
  }

  // Preserve search params from all values
  if (pathnameUrl?.searchParams.size) {
    mergeSearchParams(baseUrl.searchParams, pathnameUrl.searchParams);
  }
  if (searchParams) {
    mergeSearchParams(baseUrl.searchParams, new URLSearchParams(searchParams));
  }

  return baseUrl;
}
