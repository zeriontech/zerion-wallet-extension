export function upsert<T, K>(
  array: T[],
  newItem: T,
  getId: (item: T) => NonNullable<K>
) {
  const pos = array.findIndex((item) => getId(item) === getId(newItem));
  if (pos !== -1) {
    array.splice(pos, 1, newItem);
  } else {
    array.push(newItem);
  }
}
