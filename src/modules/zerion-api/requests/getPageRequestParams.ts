import type { Payload } from './wallet-get-actions';

/** The pending lists come with the first page only, so a cursor page never asks for them. */
export function getPageRequestParams(
  params: Payload,
  pageParam: string | undefined
): Payload {
  const { includePending, ...rest } = params;
  const cursor = pageParam ?? params.cursor;
  return includePending && !cursor
    ? { ...rest, cursor, includePending }
    : { ...rest, cursor };
}
