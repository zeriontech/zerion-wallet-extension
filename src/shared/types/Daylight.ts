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

type CommunityType = 'ERC-20' | 'ERC-721' | 'ERC-1155';

interface WalletAbilityTokenRequirement {
  chain: 'ethereum';
  type: 'hasTokenBalance';
  address: string;
  minAmount: number;
  community: {
    title: string;
    contractAddress: string;
    type: CommunityType;
    chain: 'ethereum';
    imageUrl: string;
    linkUrl: string;
    description: string;
    currencyCode: string;
    slug: string;
  };
}

interface WalletAbilityNFTRequirement {
  chain: 'ethereum';
  type: 'hasNftWithSpecificId';
  address: string;
  id: string[];
  community: {
    title: string;
    contractAddress: string;
    type: CommunityType;
    chain: 'ethereum';
    imageUrl: string;
    linkUrl: string;
    description: string;
    currencyCode: string;
    slug: string;
  };
}

interface WalletAbilityAllowlistTokenRequirement {
  chain: 'ethereum';
  type: 'onAllowlist';
  addresses: string[];
}

type WalletAbilityRequirement =
  | WalletAbilityTokenRequirement
  | WalletAbilityNFTRequirement
  | WalletAbilityAllowlistTokenRequirement;

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
  requirements: WalletAbilityRequirement[];
  submitter: {
    publicKey: string;
    chain: 'ethereum';
  };
  walletMetadata: object;
  walletCompleted: boolean;
}
