import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Quote2 } from './Quote';

type ClientScope =
  | string
  | 'Swap'
  | 'Bridge'
  | 'Send'
  | 'Zerion DNA'
  | 'External Dapp';

export type TransactionContextParams = {
  chain: string; // Cannot use type {Chain} because it's not serializable and this object is being sent between Ports
  feeValueCommon: string | null;
  initiator: string;
  clientScope: ClientScope | null;
  addressAction: AnyAddressAction | null;
  /**
   * Currenly only applies to Solana dapp requests
   * This indicates the method that the dapp called originally
   * and dictates the strategy for the SendTransaction View flow.
   * `signTransaction`:
   *     we return the signed tx to the dapp, and the dapp submits it to the node itself
   * `signAndSendTransaction`:
   *     we sign and submit tx to the node and return the "signature" (hash) to the dapp
   * `signAllTransactions`:
   *     TODO
   */
  method?: 'signTransaction' | 'signAndSendTransaction' | 'signAllTransactions';
} & (
  | { quote?: undefined; outputChain?: undefined }
  | {
      quote: Quote2;
      outputChain: string | null; // NetworkId
    }
);

export interface MessageContextParams {
  initiator: string;
  clientScope: ClientScope | null;
}
