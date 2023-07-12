/** Creates new URLSearchParams instance, new keys overwrite existing ones */
export function setURLSearchParams(
  params: URLSearchParams,
  values: Record<string, string>
) {
  const newParams = new URLSearchParams(params);
  for (const key in values) {
    newParams.set(key, values[key]);
  }
  return newParams;
}
