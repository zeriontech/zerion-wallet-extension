import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Quote } from './Quote';

type ClientScope =
  | string
  | 'Swap'
  | 'Bridge'
  | 'Send'
  | 'Zerion DNA'
  | 'External Dapp';

export interface TransactionContextParams {
  chain: string; // Cannot use type {Chain} because it's not serializable and this object is being sent between Ports
  feeValueCommon: string | null;
  initiator: string;
  clientScope: ClientScope | null;
  addressAction: AnyAddressAction | null;
  quote?: Quote;
}

export interface MessageContextParams {
  initiator: string;
  clientScope: ClientScope | null;
}
