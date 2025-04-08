import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

export interface RemoteConfig {
  extension_wallet_name_flags: Record<string, WalletNameFlag[]>;
  extension_uninstall_link: string;
  extension_loyalty_enabled: boolean;
  extension_asset_page_enabled: boolean;
  loyalty_config: Partial<{
    referrerXpPercent: number;
    gasbackValue: number;
    rewardIconLevel: number;
  }>;
}
