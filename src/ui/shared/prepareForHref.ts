export function prepareForHref(value: string | URL) {
  const url = value instanceof URL ? value : new URL(value);
  if (url.protocol === 'https:' || url.protocol === 'http:') {
    return url;
  } else {
    return null;
  }
}
