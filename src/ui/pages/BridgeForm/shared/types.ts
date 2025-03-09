export interface BridgeFormState {
  spendChainInput?: string;
  receiveChainInput?: string;

  spendInput?: string;
  receiveInput?: string;

  spendTokenInput?: string;
  receiveTokenInput?: string;

  receiverAddressInput?: string | null;
  showReceiverAddressInput?: boolean;
}
