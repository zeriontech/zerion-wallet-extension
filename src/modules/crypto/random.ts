/**
 * Generates an array of cryptographically strong random bytes.
 *
 * @param length - The number of bytes.
 */
export function getRandomUint8Array(length = 32) {
  return global.crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Creates a random base64 string.
 *
 * @param length - The number of bytes in string.
 * @returns A randomly generated string.
 */
export function getRandomBase64String(length = 32): string {
  const randomBytes = getRandomUint8Array(length);
  // Explicit casting needed to satisfy the typechecker
  const base64 = window.btoa(
    String.fromCharCode.apply(null, randomBytes as unknown as number[])
  );
  return base64;
}
