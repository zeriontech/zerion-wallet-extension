export type ExchangeOrderLegStatus =
  | { error: string }
  | { resting: { oid: number } }
  | { filled: { totalSz: string; avgPx: string; oid: number } }
  | { success: unknown }
  | Record<string, unknown>;

export interface ExchangeOrderResponseBody {
  type: 'order';
  data: { statuses: ExchangeOrderLegStatus[] };
}

export interface ExchangeResponseSuccess {
  status: 'ok';
  // The outer envelope is `ok` even when individual order legs are rejected;
  // per-leg errors live inside `response.data.statuses[i].error`. Callers
  // submitting `order` actions MUST inspect this nested shape — `status: 'ok'`
  // alone is not a fill confirmation.
  response: ExchangeOrderResponseBody | unknown;
}

export interface ExchangeResponseError {
  status: 'err';
  response: string;
}

export type ExchangeResponse = ExchangeResponseSuccess | ExchangeResponseError;

export function isOrderResponseBody(
  body: unknown
): body is ExchangeOrderResponseBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { type?: unknown }).type === 'order' &&
    Array.isArray((body as { data?: { statuses?: unknown } }).data?.statuses)
  );
}

export function getOrderLegError(
  status: ExchangeOrderLegStatus
): string | null {
  if (
    typeof status === 'object' &&
    status !== null &&
    'error' in status &&
    typeof (status as { error: unknown }).error === 'string'
  ) {
    return (status as { error: string }).error;
  }
  return null;
}
