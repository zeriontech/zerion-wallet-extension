/**
 * Backend-authored wording of a failed quotes request (a Custom Quote Error,
 * see CONTEXT.md). Parsed from the first entry of the ZPI `errors` array:
 *
 *   { "data": null, "errors": [{ "title": "Bad request",
 *     "detail": "Unshielding … Please use ${DAPP}.",
 *     "dappName": "Zama", "dappUrl": "https://app.zama.org/" }] }
 *
 * `detail` may contain the `${DAPP}` placeholder, to be replaced with a link
 * built from `dappName` / `dappUrl`.
 */
export interface QuoteErrorDetails {
  title: string | null;
  detail: string | null;
  dappName: string | null;
  dappUrl: string | null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** Returns `null` unless the payload carries a title or a detail. */
export function parseQuoteErrorDetails(
  payload: unknown
): QuoteErrorDetails | null {
  if (!payload || typeof payload !== 'object' || !('errors' in payload)) {
    return null;
  }
  const { errors } = payload;
  const first: unknown = Array.isArray(errors) ? errors[0] : null;
  if (!first || typeof first !== 'object') {
    return null;
  }
  const entry = first as Record<string, unknown>;
  const details: QuoteErrorDetails = {
    title: nonEmptyString(entry.title),
    detail: nonEmptyString(entry.detail),
    dappName: nonEmptyString(entry.dappName),
    dappUrl: nonEmptyString(entry.dappUrl),
  };
  return details.title || details.detail ? details : null;
}

/** Parses a JSON string; anything unparsable yields `null`. */
export function parseQuoteErrorDetailsFromText(
  text: string
): QuoteErrorDetails | null {
  try {
    return parseQuoteErrorDetails(JSON.parse(text));
  } catch {
    return null;
  }
}
