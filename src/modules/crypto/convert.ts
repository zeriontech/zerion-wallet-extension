export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return uint8ArrayToBase64(bytes);
}

export function uint8ArrayToBase64(array: Uint8Array) {
  // Explicit casting needed to satisfy the typechecker
  return window.btoa(
    String.fromCharCode.apply(null, array as unknown as number[])
  );
}

export function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
