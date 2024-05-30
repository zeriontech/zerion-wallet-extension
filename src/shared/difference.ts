export function difference<T>(a: T[], b: T[]) {
  const set = new Set(b);
  return a.filter((value) => !set.has(value));
}
