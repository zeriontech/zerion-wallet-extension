export const LABEL_ADDRESS_COPIED_EVENT = 'Label Address Copied';

export type LabelCopyScreen =
  | 'history_details'
  | 'signing_preview'
  | 'signing_advanced'
  | 'cli_preview';

export type LabelAddressCopiedParams = {
  address: string;
  chain: string | null;
  label_title: string | null;
  act_type: string;
  screen: LabelCopyScreen;
  platform: 'extension';
};
