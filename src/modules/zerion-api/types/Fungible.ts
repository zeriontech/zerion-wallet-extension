type AssetImplementation = {
  /**
   * @description Address of the asset implementation
   * @example 0x3a3f615b05aad54d8a7af1d1b20854f0513278da
   */
  address: string | null;
  /**
   * @description Decimals for the asset implementation
   * @example 18
   */
  decimals: number;
};

export type Fungible = {
  /** @example 0x517f9dd285e75b599234f7221227339478d0fcc8 */
  id: string;
  /** @example Ethereum */
  name: string;
  /** @example ETH */
  symbol: string;
  /**
   * @description Implementations of the asset on different chains
   * @example {
   *       "polygon": {
   *         "address": "0x3a3f615b05aad54d8a7af1d1b20854f0513278da",
   *         "decimals": 18
   *       }
   *     }
   */
  implementations: {
    [key: string]: AssetImplementation;
  };
  /** @example https://token-icons.s3.amazonaws.com/eth.png */
  iconUrl: string | null;
  /**
   * @description Whether the asset is verified
   * @example true
   */
  verified: boolean;
  /**
   * @description Whether the asset was added last 24h
   * @example true
   */
  new: boolean;
  meta: {
    /**
     * Format: float64
     * @description Circulating supply of the asset, divided by 10 ** decimals
     * @example 69551291.96246625
     */
    circulatingSupply: number | null;
    /**
     * Format: float64
     * @description Total supply of the asset, divided by 10 ** decimals
     * @example 122373866.2178
     */
    totalSupply: number | null;
    /**
     * Format: float64
     * @description Price of the asset, in requested currency // [!code link {"token":"Price","href":"/docs-v2/swap/entities.html#price"}]
     * @example 1893.1299999999999
     */
    price: number | null;
    /**
     * Format: float64
     * @description Market cap of the asset (circulating supply * price), in requested currency // [!code link {"token":"Market","href":"/docs-v2/swap/entities.html#market"}]
     * @example 131669637352.90372
     */
    marketCap: number | null;
    /**
     * Format: float64
     * @description Fully diluted valuation of the asset (total supply * price), in requested currency
     * @example 231669637352.90372
     */
    fullyDilutedValuation: number | null;
    /**
     * Format: float64
     * @description Relative price change
     * @example 1.5649477456597802
     */
    relativeChange1d: number | null;
    /**
     * Format: float64
     * @description Relative price change
     * @example 20.32249043460574
     */
    relativeChange30d: number | null;
    /**
     * Format: float64
     * @description Relative price change
     * @example 2.43766503614562
     */
    relativeChange90d: number | null;
    /**
     * Format: float64
     * @description Relative price change
     * @example 2.43766503614562
     */
    relativeChange365d: number | null;
  };
};
