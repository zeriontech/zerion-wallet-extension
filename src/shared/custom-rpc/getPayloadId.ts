let i = 1;
const initialValue = crypto.getRandomValues(new Uint32Array(1))[0];

/**
 * returns a unique random value always larger than the previous one
 */
export function getPayloadId(): number {
  return initialValue + i++;
}
