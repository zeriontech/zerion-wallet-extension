// Shared event types for perps analytics. Mirrors the web app's
// `PerpsPositionActionParams` / `PERPS_SCREEN` / `PERPS_BUTTON` so the same
// Mixpanel / Metabase events emit the same shape from both apps.

export const PERPS_SCREEN = {
  Asset: 'Asset',
  Overview: 'Overview',
  Deposit: 'Deposit',
  Withdraw: 'Withdraw',
  Long: 'Long',
  Short: 'Short',
  AddToLong: 'Add to Long',
  AddToShort: 'Add to Short',
  CloseLong: 'Close Long',
  CloseShort: 'Close Short',
  AdjustLeverage: 'Adjust Leverage',
  TakeProfitStopLoss: 'Take Profit / Stop Loss',
} as const;

export const PERPS_BUTTON = {
  Deposit: 'Deposit',
  Withdraw: 'Withdraw',
  Long: 'Long',
  Short: 'Short',
  Add: 'Add',
  Close: 'Close',
  AdjustLeverage: 'Adjust Leverage',
  TakeProfitStopLoss: 'Take Profit / Stop Loss',
} as const;

export interface PerpsScreenViewedParams {
  screen_name: string;
  asset_name?: string;
}

export interface PerpsButtonPressedParams {
  button_name: string;
  screen_name: string;
}

export interface PerpsPositionActionParams {
  position_side: 'Long' | 'Short';
  action_type: 'Open' | 'Add' | 'Close';
  asset_name: string;
  leverage: number;
  zerion_fee_percentage: number;
  zerion_fee_usd_amount: number;
  provider_fee_percentage: number;
  provider_fee_usd_amount: number;
  entry_price_usd: number;
  size: number;
  margin: number;
  delta_size: number;
  delta_margin: number;
  screen_name: string;
  success_status: boolean;
  amount_usd?: number;
  liquidation_price_usd?: number;
  backend_error_message?: string;
  take_profit_usd?: number;
  stop_loss_usd?: number;
  receive_usd_amount?: number;
  realized_pnl_usd?: number;
}

/**
 * Built by the trade forms at submit time. The submission flow adds the
 * outcome (`success_status` / `backend_error_message`) once the order settles.
 */
export type PerpsPositionActionFormParams = Omit<
  PerpsPositionActionParams,
  'success_status' | 'backend_error_message'
>;
