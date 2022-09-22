import { ethers } from 'ethers';
import { IncomingTransaction } from '../../types/IncomingTransaction';

const fields = ['data', 'value', 'gas'] as const;
type Keys = typeof fields[number];
type HexifiedTx<Keys extends keyof IncomingTransaction> =
  IncomingTransaction & { [key in Keys]?: string };

export function hexifyTxValues(
  transaction: IncomingTransaction
): HexifiedTx<Keys> {
  // NOTE: this helper only turns into hex these fields: data, value, gas
  const copy = { ...transaction };
  for (const field of fields) {
    const value = copy[field];
    if (value != null) {
      copy[field] = ethers.utils.hexValue(value);
    }
  }
  return copy as HexifiedTx<Keys>;
}
