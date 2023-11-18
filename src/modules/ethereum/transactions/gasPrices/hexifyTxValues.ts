import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from '../../types/IncomingTransaction';

const fields = ['data', 'value', 'gas'] as const;
type Keys = (typeof fields)[number];
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
      copy[field] = valueToHex(value);
    }
  }
  return copy as HexifiedTx<Keys>;
}
