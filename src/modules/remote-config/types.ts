import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

export interface RemoteConfig {
  user_can_create_initial_wallet: boolean;
  extension_wallet_name_flags: Record<string, WalletNameFlag[]>;
  extension_invitation_campaign_id: string;
  extension_show_footer_bug_button: boolean;
}
