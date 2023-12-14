export type WalletAbilityType =
  | 'vote'
  | 'claim'
  | 'airdrop'
  | 'mint'
  | 'article'
  | 'access'
  | 'result'
  | 'event'
  | 'merch'
  | 'misc'
  | 'raffle'
  | 'discount'
  | 'stake'
  | 'revoke';

interface WalletAbilitySupplier {
  id: number;
  name: string;
  slug: string;
  url: string;
}

type WalletAbilityReason = {
  text: string;
  type:
    | 'allowlist'
    | 'tokengate'
    | 'open'
    | 'static-list'
    | 'influencer'
    | 'trending'; // could be extended later
  imageUrl: string | null;
};

export interface WalletAbility {
  type: WalletAbilityType;
  title: string;
  description: string;
  imageUrl: string;
  openAt: string;
  closeAt: string;
  isClosed: boolean;
  createdAt: string;
  slug: string;
  sourceId: string;
  chain: 'ethereum';
  uid: string;
  supplier: WalletAbilitySupplier;
  action: {
    linkUrl: string;
    // in the future here will be more info for completing the ability
  };
  reason: WalletAbilityReason;
  submitter: {
    publicKey: string;
    chain: 'ethereum';
  };
  walletMetadata: object;
  walletCompleted: boolean;
}
