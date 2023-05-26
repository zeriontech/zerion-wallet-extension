import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

export interface RemoteConfig {
  user_can_create_initial_wallet: boolean;
  extension_wallet_name_flags: Record<string, WalletNameFlag[]>;
}
