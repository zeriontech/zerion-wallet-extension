export interface Payload {
  addresses: string[];
  currency: string;
}

interface Collection {
  id: string;
  name: string | null;
  iconUrl: string | null;
  chain: string | null;
  slug: string;
  description: string | null;
  bannerImageUrl: string | null;
  category: string | null;
  paymentTokenSymbol: string | null;
  marketplaceData: {
    floorPrice: number | null;
    nftsCount: number | null;
    ownersCount: number | null;
    oneDayVolume: number | null;
    oneDayChange: number | null;
    totalVolume: number | null;
  } | null;
}

export interface TrandingNFTs {
  id: 'trending_nfts';
  collections: Collection[];
}

interface Dapp {
  name: string;
  iconUrl: string;
  url: string;
}

export interface FeaturedDapps {
  id: 'featured_dapps';
  dapps: Dapp[];
}

interface Fungible {
  id: string;
  name: string;
  symbol: string;
  iconUrl: string | null;
  meta: {
    price: number | null;
    marketCap: number | null;
    relativeChange1d: number | null;
    relativeChange30d: number | null;
    relativeChange90d: number | null;
  };
}

export interface TopMovers {
  id: 'top_movers';
  fungibles: Fungible[];
}

export interface TopTokens {
  id: 'top_tokens';
  fungibles: Fungible[];
}

interface Mint {
  id: string;
  title: string;
  type: 'opened' | 'hidden' | 'completed';
  isExclusive: boolean;
  reason: {
    title: string;
    subtitle: string;
    type:
      | 'allowlist'
      | 'tokengate'
      | 'influencer'
      | 'trending'
      | 'creator'
      | 'minted-from-creator-before'
      | 'trending-in-community';
    wallets: {
      name: string;
      iconUrl: string | null;
      address: string;
      premium: boolean;
    }[];
  };
  description: string;
  openedAt: string | null;
  imageUrl: string;
  action: string;
  chain: string | null;
  contract: string | null;
}

export interface MintsForYou {
  id: 'mints_for_you';
  mints: Mint[];
}

interface Wallet {
  name: string;
  iconUrl: string | null;
  address: string;
  premium: boolean;
}

export interface PopularWallets {
  id: 'popular_wallets';
  wallets: Wallet[];
}

interface Data {
  sections: ({
    title: string;
    order: number;
    isSearchEnabled: boolean;
  } & (
    | TrandingNFTs
    | FeaturedDapps
    | TopMovers
    | TopTokens
    | MintsForYou
    | PopularWallets
  ))[];
}

export interface Response {
  data: Data;
  errors?: { title: string; detail: string }[];
}
