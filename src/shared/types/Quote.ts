export interface ContractMetadata {
  id: string;
  name: string;
  icon_url: string;
  explorer: {
    name: string;
    tx_url: string;
  };
}

export interface TransactionDescription {
  data: string;
  from: string;
  to: string;
  gas: number;
  value: string;
  chain_id: string;
}

export interface Quote {
  contract_metadata: ContractMetadata | null;
  slippage_type?: 'normal' | 'zero-slippage';

  input_chain: string;
  input_asset_id: string;
  input_token_address: string;
  input_token_id: string | null;
  input_amount_estimation: string;
  input_amount_max: string;

  output_chain: string;
  output_asset_id: string;
  output_token_address: string;
  output_token_id: string | null;
  output_amount_estimation: string;

  guaranteed_output_amount: string;
  output_amount_min: string;

  token_spender: string;

  gas_estimation: number | null;
  seconds_estimation: number | null;

  transaction: TransactionDescription | null;

  enough_allowance?: boolean;
  enough_balance: boolean;

  base_protocol_fee: number;

  protocol_fee: number;
  protocol_fee_amount: string;
  protocol_fee_asset_id: string | null;
  protocol_fee_asset_address: string | null;
  protocol_fee_taken_on_top: boolean | null;

  marketplace_fee: number;
  marketplace_fee_amount: number;

  bridge_fee_asset_id: string | null;
  bridge_fee_asset_address: string | null;
  bridge_fee_taken_on_top: boolean | null;
  bridge_fee_amount: string;
}
