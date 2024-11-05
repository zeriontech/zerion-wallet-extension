import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

export interface RemoteConfig {
  extension_wallet_name_flags: Record<string, WalletNameFlag[]>;
  extension_uninstall_link: string;
  ios_loyalty_config: Partial<{
    isEnabled: boolean;
    gasbackValue: number;
    rewardIconLevel: number;
  }>;
}
