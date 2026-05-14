// `maxBuilderFee` /info returns a single number representing the max approved
// builder fee in builder-fee units (denominator 1e6, e.g. `100` = 0.0001 = 0.01%).
// Returns 0 when no fee has been approved yet.
export type PerpMaxBuilderFeeResponse = number;

export interface PerpMaxBuilderFeePayload {
  address: string;
  builder: string;
}
