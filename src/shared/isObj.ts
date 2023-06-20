export function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x != null;
}
