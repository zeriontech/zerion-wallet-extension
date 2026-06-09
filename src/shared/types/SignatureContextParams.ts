import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { SwapFormState } from 'src/ui/pages/SwapForm/shared/SwapFormState';
import type { BridgeFormState } from 'src/ui/pages/BridgeForm/types';
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
  warningWasShown?: boolean;
  outputAmountColor?: 'grey' | 'red';
  /**
   * Overrides the `action_type` reported in the "Signed Transaction" event.
   * By default `action_type` is derived from the addressAction's displayValue,
   * which makes a cross-chain swap report `Bridge`. The swap flow forces
   * `Trade` here so same-chain and cross-chain swaps share one Action Type and
   * the Swap/Bridge distinction is carried solely by `client_scope` (WLT-1293).
   */
  actionType?: string;
  /**
   * Autoslippage A/B experiment group label (e.g. `'Group1'` / `'Control'`),
   * resolved in the UI and forwarded so the background "Signed Transaction"
   * event can report `autoslippage_test_group`. Only set for swap flows.
   */
  autoslippageTestGroup?: string;
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

export type TransactionFormedContext = {
  scope: 'Swap' | 'Bridge';
  formState: SwapFormState | BridgeFormState;
  slippagePercent?: number;
  quote: Quote2;
  enoughBalance: boolean;
  warningWasShown: boolean;
  outputAmountColor: 'red' | 'grey';
  /** Autoslippage A/B experiment group label (e.g. `'Group1'` / `'Control'`). */
  autoslippageTestGroup?: string;
};
