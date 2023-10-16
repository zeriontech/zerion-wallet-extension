export function isClassProperty<T, K extends keyof T>(
  object: T,
  method: string | K
): method is K {
  const prototype = Object.getPrototypeOf(object);
  return (
    Object.prototype.hasOwnProperty.call(object, method) ||
    Object.prototype.hasOwnProperty.call(prototype, method)
  );
}
