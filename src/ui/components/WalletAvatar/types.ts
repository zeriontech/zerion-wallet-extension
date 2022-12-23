export interface WalletProfileNFTImage {
  url: string;
  meta: null | Record<string, string>;
}

export interface WalletProfileNFT {
  id: string;
  name: string;
  contract?: { address: string };
  preview: WalletProfileNFTImage;
  detail: WalletProfileNFTImage;
}

interface WalletProfileMeta {
  onboarded: boolean;
}

export interface WalletProfile {
  address: string;
  nft?: WalletProfileNFT;
  meta_information?: WalletProfileMeta;
}

export interface WalletProfilesResponse {
  profiles?: [WalletProfile];
}
