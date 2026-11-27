export type HyperliquidReferralPromptAction =
  | 'shown'
  | 'clicked_apply'
  | 'applied'
  | 'failed'
  | 'dismissed'
  | 'not_shown';

export interface HyperliquidReferralPromptParams {
  action: HyperliquidReferralPromptAction;
  /** Set for `not_shown`: why the prompt was not offered. */
  reason?: string;
  /** Redacted exchange/provider error for `failed`. */
  error_message?: string | null;
  /** Where the code came from; currently only `remote_config`. */
  code_source?: 'remote_config';
}

export type HyperliquidAccountCardAction = 'shown' | 'clicked_manage' | 'dismissed';

export interface HyperliquidAccountCardParams {
  action: HyperliquidAccountCardAction;
  equity_usd: number;
  unrealized_pnl_usd: number;
  positions_count: number;
  /** `active_tab` when app.hyperliquid.xyz is the active tab. */
  source: 'active_tab' | 'account';
}

export type HyperliquidFundingPromptAction = 'shown' | 'clicked_deposit' | 'dismissed';

export interface HyperliquidFundingPromptParams {
  action: HyperliquidFundingPromptAction;
  selected_chain?: string | null;
  selected_symbol?: string | null;
  amount_usd?: number | null;
  fees_usd?: number | null;
}
