export const DAPP_PLACEHOLDER = '${DAPP}';

export type DescriptionPart =
  | { kind: 'text'; text: string }
  /**
   * A DApp Referral (see CONTEXT.md). `label: null` means neither a name nor a
   * usable URL was given — render a generic "the dApp".
   * `href: null` means render the label as plain text.
   */
  | { kind: 'dapp'; label: string | null; href: string | null };

/** Only absolute http(s) URLs are ever opened. */
function toSafeHref(url: string | null): URL | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/**
 * Splits a backend-authored detail on the `${DAPP}` placeholder. Degrades
 * rather than fails: no URL → plain name, no name → the URL's host, neither →
 * generic label. A URL without a placeholder is not shown.
 */
export function splitDappPlaceholder(
  text: string,
  dapp: { name: string | null; url: string | null } | undefined
): DescriptionPart[] {
  const segments = text.split(DAPP_PLACEHOLDER);
  const safeUrl = toSafeHref(dapp?.url ?? null);
  const label = dapp?.name ?? safeUrl?.host ?? null;
  const href = safeUrl?.href ?? null;

  const parts: DescriptionPart[] = [];
  segments.forEach((segment, index) => {
    if (index > 0) {
      parts.push({ kind: 'dapp', label, href });
    }
    if (segment) {
      parts.push({ kind: 'text', text: segment });
    }
  });
  return parts;
}
