/**
 * Shapes shared by the `deposit/*` endpoints — the fiat on-ramp aggregator.
 * These are deliberately slimmer than {@link Fungible}: the on-ramp endpoints
 * return an outline, not a full asset.
 */

export type OnrampFungible = {
  /** @example eth */
  id: string;
  /** @example Ethereum */
  name: string;
  /** @example ETH */
  symbol: string;
  iconUrl: string | null;
};

export type OnrampChain = {
  /** @example ethereum */
  id: string;
  /** @example Ethereum */
  name: string;
  iconUrl: string | null;
  testnet: boolean;
};

export type OnrampAsset = {
  asset: OnrampFungible;
  chain: OnrampChain;
};

/**
 * @description Restricts the suggested-token list to one ecosystem. Unrecognised
 * values do not error — the backend silently falls back to the EVM list.
 */
export type OnrampEcosystem = 'ethereum' | 'solana';

export type OnrampProvider = {
  /** @example moonpay */
  id: string;
  /** @example Moonpay */
  name: string;
  iconUrl: string;
};

export type OnrampPaymentMethod = {
  /** @example credit_debit_card */
  id: string;
  /** @example Card */
  name: string;
  iconUrl: string;
};

export type DepositQuote = {
  asset: OnrampFungible;
  chain: OnrampChain;
  amount: {
    /**
     * @description Symbol of the *asset* being bought, not the fiat currency
     * being spent.
     * @example ETH
     */
    currency: string;
    /**
     * @description Amount of the asset, as a decimal string
     * @example 0.039719
     */
    quantity: string;
    /**
     * @description The fiat amount this quote is actually priced for. It can
     * exceed the requested `fiatAmount` when that is below the provider's
     * minimum — the provider quotes its minimum instead of refusing.
     */
    value: number | null;
    /** @description Always null in every response observed so far */
    usdValue: number | null;
  };
  provider: OnrampProvider;
  /** @description Always null in every response observed so far */
  description: string | null;
  supportedPaymentMethods: OnrampPaymentMethod[];
};

export type OnrampCountry = {
  /**
   * @description ISO 3166-1 alpha-2 country code
   * @example DE
   */
  id: string;
  /** @example Germany */
  name: string;
};
