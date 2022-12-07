interface WalletProfileNFTImage {
  url: string;
  meta: { type: string };
}

interface WalletProfileNFT {
  id: string;
  name: string;
  contract?: { address: string };
  preview?: WalletProfileNFTImage;
  detail?: WalletProfileNFTImage;
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
