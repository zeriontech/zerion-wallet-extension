export function isClassProperty(object: unknown, method: string) {
  const prototype = Object.getPrototypeOf(object);
  return (
    Object.prototype.hasOwnProperty.call(object, method) ||
    Object.prototype.hasOwnProperty.call(prototype, method)
  );
}
