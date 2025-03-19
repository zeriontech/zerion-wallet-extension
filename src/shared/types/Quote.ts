interface Exchange {
  icon_url: string | null;
  share: number;
}

interface ExchangeWithName extends Exchange {
  name: string;
}

interface ContractMetadata {
  id: string;
  name: string;
  icon_url: string;
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
  input_amount_estimation: string;
  input_token_address: string;
  input_chain: string;
  output_amount_estimation: string;
  output_token_address: string;
  output_chain: string;
  guaranteed_output_amount: string;
  token_spender: string;
  exchanges: ExchangeWithName[] | null;
  contract_metadata: ContractMetadata | null;
  gas_estimation: string | null;
  enough_allowance?: boolean;
  enough_balance: boolean;
  slippage_type?: 'normal' | 'zero-slippage';
  estimated_seconds?: string | null;
  base_protocol_fee: number;
  marketplace_fee: number;
  protocol_fee: number;
  protocol_fee_amount: string;
  bridge_fee_asset_id: string | null;
  bridge_fee_taken_on_top: boolean | null;
  bridge_fee_amount: string;
  transaction: TransactionDescription | null;
}
