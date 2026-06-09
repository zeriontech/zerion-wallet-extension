import { ethers } from 'ethers';
import type { ExchangeAction } from '../actions/types';

// Layout: msgpack(action) || u64_be(nonce) || 0x00 [|| 0x00 || u64_be(expiresAfter)]
// Result: keccak256 of the concatenation. This is the `connectionId` placed
// inside the L1Action typed data `Agent.connectionId` field.

function u64BigEndian(n: number): Uint8Array {
  // JS numbers handle up to 2^53; nonce is ms timestamp (~10^13), safe.
  const out = new Uint8Array(8);
  let value = BigInt(n);
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

export async function hashAction({
  action,
  nonce,
  expiresAfter,
}: {
  action: ExchangeAction;
  nonce: number;
  expiresAfter?: number;
}): Promise<string> {
  const { encode } = await import('@msgpack/msgpack');
  const actionBytes = encode(action as unknown as Record<string, unknown>);

  const nonceBytes = u64BigEndian(nonce);
  const tail: number[] = [];
  if (expiresAfter != null) {
    tail.push(0x00);
    const expBytes = u64BigEndian(expiresAfter);
    tail.push(...expBytes);
  }

  const buf = new Uint8Array(actionBytes.length + 8 + 1 + tail.length);
  buf.set(actionBytes, 0);
  buf.set(nonceBytes, actionBytes.length);
  buf[actionBytes.length + 8] = 0x00;
  if (tail.length > 0) {
    buf.set(Uint8Array.from(tail), actionBytes.length + 9);
  }

  return ethers.keccak256(buf);
}
