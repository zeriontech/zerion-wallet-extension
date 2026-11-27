import type { Fungible } from './Fungible';

export interface NetworkFeeType {
  free: boolean;
  /**
   * Expected gas units the fee is priced on (WLT-2743). Absent when the backend
   * cannot estimate it; callers then derive it from the amount and gas price.
   * ZPI returns this camelCase (`gasUsed`).
   */
  gasUsed?: number | null;
  amount: {
    /** @description Amount in common units (like token units) */
    quantity: string;
    /** @description Amount in fiat units */
    value: number | null;
    usdValue: number | null;
  } | null;
  fungible: null | Fungible;
}
