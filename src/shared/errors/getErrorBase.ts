/**
 * Error normalizer vendored from get-error 1.0.1 (MIT).
 * The package is a single 100-line function with very low usage; keeping it
 * local removes a supply-chain dependency without changing behavior.
 */
function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && typeof value === 'object' && 'message' in value);
}

function fromMessageObject(value: unknown): Error | null {
  if (isErrorMessageObject(value)) {
    const error = new Error(value.message);
    return Object.assign(error, value);
  }
  return null;
}

function fromResponse(value: unknown): Error | null {
  if (value instanceof Response) {
    return new Error(`${value.status} ${value.statusText}`);
  }
  return null;
}

function fromPrimitiveType(value: unknown, fallback: Error): Error | null {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  if (Array.isArray(value) || typeof value !== 'object') {
    return fallback;
  }
  return null;
}

function fromKnownErrorInstance(value: unknown): Error | null {
  return value instanceof Error ? value : null;
}

function fromRpcObject(value: unknown, fallback: Error): Error | null {
  if (value !== null && typeof value === 'object' && 'error' in value) {
    return fromPrimitiveType(value.error, fallback) || fromMessageObject(value.error);
  }
  return null;
}

export function getError(value: unknown, fallback = new Error('Unknown Error')): Error {
  return (
    fromPrimitiveType(value, fallback) ||
    fromKnownErrorInstance(value) ||
    fromResponse(value) ||
    fromMessageObject(value) ||
    fromRpcObject(value, fallback) ||
    fallback
  );
}
