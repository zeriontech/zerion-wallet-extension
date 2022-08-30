export function upsert<T, K extends keyof T>(array: T[], newItem: T, idKey: K) {
  const pos = array.findIndex((item) => item[idKey] === newItem[idKey]);
  if (pos !== -1) {
    array.splice(pos, 1, newItem);
  } else {
    array.push(newItem);
  }
}
