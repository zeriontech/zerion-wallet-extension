import type { Brand } from '../type-utils/Brand';

export type LocallyEncoded = Brand<string, 'LocallyEncoded'>;

const NONSECRET_KEY_FOR_INTERNAL_USE = '2024-06-18';

/**
 * This function is intended to mask a secret value that is being
 * passed between extension scripts (ui, service-worker and web-worker)
 * and may live in memory for some time.
 * The purpose is to prevent passing clear text.
 * This "encoding" is simply one step less trivial than base64
 * and should not be considered encryption.
 */
export function encodeForMasking(value: string) {
  const key = NONSECRET_KEY_FOR_INTERNAL_USE;
  let encoded = '';
  for (let i = 0; i < value.length; i++) {
    encoded += String.fromCharCode(
      value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(encoded) as LocallyEncoded;
}

export function decodeMasked(encoded: LocallyEncoded) {
  const key = NONSECRET_KEY_FOR_INTERNAL_USE;
  const decoded = atob(encoded);
  let data = '';
  for (let i = 0; i < decoded.length; i++) {
    data += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return data;
}
