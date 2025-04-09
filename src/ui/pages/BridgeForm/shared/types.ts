export type BridgeFormState = {
  spendChainInput?: string;
  receiveChainInput?: string;

  spendInput?: string;
  receiveInput?: string;

  spendTokenInput?: string;
  receiveTokenInput?: string;

  to?: string | null;
  receiverAddressInput?: string | null;
  showReceiverAddressInput?: boolean;
};
