export async function getSHA256HexDigest(message: string): Promise<string> {
  const encoder = new TextEncoder();
  // encode as (utf-8) Uint8Array
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  return hashHex;
}
