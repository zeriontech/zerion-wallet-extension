export function intersperce<T>(
  arr: (T | null | undefined)[],
  getJoiner: (key: number, index: number) => T
): T[] {
  const result: T[] = [];
  let index = 0;
  for (const el of arr) {
    if (el == null) {
      continue;
    }
    if (index > 0 && result.length) {
      result.push(getJoiner(index * -1, index));
    }
    result.push(el);
    index++;
  }
  return result;
}
