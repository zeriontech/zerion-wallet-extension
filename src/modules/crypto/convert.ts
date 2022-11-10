export function utf8ToUint8Array(str: string) {
  return new TextEncoder().encode(str);
}

export function uint8ArrayToUtf8(array: Uint8Array) {
  return new TextDecoder().decode(array);
}

export function arrayBufferToUtf8(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return uint8ArrayToUtf8(bytes);
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return uint8ArrayToBase64(bytes);
}

export function base64ToArrayBuffer(base64: string) {
  return base64ToUint8Array(base64).buffer;
}

export function base64ToUint8Array(base64: string) {
  const binary = window.atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < array.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

export function uint8ArrayToBase64(array: Uint8Array) {
  // Explicit casting is needed to satisfy the typechecker
  return window.btoa(
    String.fromCharCode.apply(null, array as unknown as number[])
  );
}
