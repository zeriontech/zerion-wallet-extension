import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from '../../types/IncomingTransaction';

const fields = [
  'data',
  'value',
  'gas',
  'gasLimit',
  'gasPrice',
  'maxPriorityFeePerGas',
  'maxFeePerGas',
] as const;
type Keys = (typeof fields)[number];
type HexifiedTx<Keys extends keyof IncomingTransaction> =
  IncomingTransaction & { [key in Keys]?: string };

export function hexifyTxValues({
  transaction,
  transformEmptyString = false,
}: {
  transaction: IncomingTransaction;
  transformEmptyString?: boolean;
}): HexifiedTx<Keys> {
  // NOTE: this helper only turns into hex these fields: data, value, gas
  const copy = { ...transaction };
  for (const field of fields) {
    const value = copy[field];
    if (value != null) {
      copy[field] = valueToHex(value, transformEmptyString);
    }
  }
  return copy as HexifiedTx<Keys>;
}
