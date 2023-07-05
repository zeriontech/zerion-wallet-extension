import type { MediaContentValue } from 'src/shared/types/MediaContentValue';

interface NFTAttribute {
  key: string;
  value?: string;
}

interface NFTMetadata {
  name: string;
  description?: string;
  tags: string[];
  content?: MediaContentValue;
  attributes: NFTAttribute[];
}

interface ConvertedPrices {
  floor_price: number;
  total_floor_price?: number;
  currency: string;
}

interface NativePrices {
  floor_price: number;
  total_floor_price?: number;
  buy_now_price?: number;
  payment_token: {
    symbol: string;
  };
}

interface NFTPrice {
  native?: NativePrices;
  converted?: ConvertedPrices;
}

export interface NFTCollection {
  id: string;
  name?: string;
  description?: string;
  icon_url?: string;
  payment_token_symbol?: string;
  slug?: string;
}

export interface NFT {
  contract_address: string;
  token_id: string;
  chain: string;
  metadata: NFTMetadata;
  collection: NFTCollection;
  prices: NFTPrice;
  relevant_urls?: { name: string; url: string }[];
}

export interface AddressNFT extends NFT {
  changed_at?: number;
  amount?: number;
}
