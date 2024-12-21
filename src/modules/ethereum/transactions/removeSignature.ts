import type { Signature } from 'ethers';
import { produce } from 'immer';

interface MaybeWithSignature {
  r?: string;
  s?: string;
  v?: number;
  signature?: Signature;
  customData?: {
    customSignature?: string;
    paymasterParams?: { paymaster?: string; paymasterInput?: Uint8Array };
  };
}

function toPlainObject<T extends object>(x: T): T {
  const entries = Object.entries(x).filter(
    (entry) => typeof entry[1] !== 'function'
  );
  return Object.fromEntries(entries) as T;
}

export function removeSignature<T extends MaybeWithSignature>(
  tx: T
): Omit<T, 'r' | 's' | 'v' | 'signature'> {
  const value = produce(toPlainObject(tx), (draft) => {
    delete draft.r;
    delete draft.s;
    delete draft.v;
    delete draft.signature;
    delete draft.customData?.customSignature;
    delete draft.customData?.paymasterParams?.paymasterInput;
  });
  return value;
}
