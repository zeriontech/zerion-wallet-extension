type WalletAddress = string;
/**
 * ActivityRecord is created to store last chain used in SwapForm,
 * but it also can be extended to store more of similar data.
 *
 * Why not query last used chain from the blockchain instead?
 * * We still would need to query locally pending transactions;
 * * We would need to go through many transactions before finding a "swap":
 *   * what if last N txs were mints or dapp interactions or something else? We
 *   * would need to go through an unknown number of txs and parse them, which is
 *   * hard, and also distinguish between dapp txs and extension ones;
 *   * Querying transactions is also slow, so this would degrade SwapForm initial render;
 * Because of the above, it seems that it's most appropriate to simply store this
 * data locally by reacting to a locally made Swap.
 *
 * NOTE: When wallet address or wallet group is being removed, this ActivityRecord
 * should be cleaned up.
 */
export interface ActivityRecord {
  [key: WalletAddress]: { lastSwapChain?: string };
}
