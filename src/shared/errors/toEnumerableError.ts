/**
 * Standard Error objects have non-enumerable properties for name and message
 * and they get lost when they are being sent through {chrome.runtime.Port} ports.
 * By making these properties enumerable, we make sure they persist between realms
 */
export function toEnumerableError(value: Error) {
  const error = structuredClone(value);
  const toDescriptor = <T>(value: T) => ({ value, enumerable: true });
  Object.defineProperty(error, 'message', toDescriptor(value.message));
  Object.defineProperty(error, 'name', toDescriptor(value.name));
  if ('code' in value) {
    Object.defineProperty(error, 'code', toDescriptor(value.code));
  }
  if ('data' in value) {
    Object.defineProperty(error, 'data', toDescriptor(value.data));
  }
  return error;
}
