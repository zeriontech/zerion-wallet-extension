import { getError as getErrorBase } from 'get-error';

export function normalizeErrorMessage(error: Error) {
  if (!error.message) {
    const clone = structuredClone(error);
    const message = error.message || error.name;
    Object.defineProperty(clone, 'message', { value: message });
    return clone;
  } else {
    return error;
  }
}

export function getError(value: Error | unknown): Error {
  return normalizeErrorMessage(getErrorBase(value));
}
