export function removeEmptyValues<T extends object>(obj: T) {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined)
    .reduce((obj, [key, value]) => {
      obj[key as keyof T] = value;
      return obj;
    }, {} as Partial<T>) as T;
}
