import type { HyperliquidSignature } from '../actions/types';

export function parseSignatureHex(signatureHex: string): HyperliquidSignature {
  if (!signatureHex.startsWith('0x') || signatureHex.length !== 132) {
    throw new Error('Invalid signature hex');
  }
  const hex = signatureHex.slice(2);
  const rHex = hex.slice(0, 64);
  const sHex = hex.slice(64, 128);
  const vHex = hex.slice(128, 130);
  const v = parseInt(vHex, 16);
  if (Number.isNaN(v)) {
    throw new Error('Invalid signature v');
  }
  return {
    r: '0x' + rHex,
    s: '0x' + sHex,
    v,
  };
}
