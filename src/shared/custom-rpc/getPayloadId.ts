let base = 1;
const typedArray = new Uint16Array(1);

/**
 * returns a unique random value always larger than the previous one
 */
export function getPayloadId(): number {
  if (base >= 2 ** 15 - 1) {
    base = 1;
  }
  return (base++ << 16) + crypto.getRandomValues(typedArray)[0];
}
