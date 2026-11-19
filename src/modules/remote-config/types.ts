import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

export interface RemoteConfig {
  extension_wallet_name_flags: Record<string, WalletNameFlag[]>;
  extension_uninstall_link: string;
  extension_loyalty_enabled: boolean;
  extension_asset_page_enabled: boolean;
  fee_comparison_config: Array<{
    imgSrc: string;
    title: string;
    fee: number;
    isZerionFee: boolean;
  }>;
  zerion_fee_learn_more_link: string;
  premium_page_feedback_link: string;
  quotes_refetch_interval: number;
  tx_polling_preferences: {
    interval_ms: number;
    max_attempts: number;
  };
  swap_form_balance_pulling_params: {
    interval_ms: number;
    max_attempts: number;
  };
  extension_fee_hint_config: {
    /**
     * Show the confirm-screen Slow hint when this transaction's Fast fee minus
     * its Slow fee is at least this many USD. Dollar saving, not a ratio.
     */
    min_savings_usd: number;
  };
}
