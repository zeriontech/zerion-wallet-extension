export const DNA_COLLECTION_ID = '23';
export const DNA_NFT_COLLECTION_ADDRESS =
  '0x932261f9fc8da46c4a22e31b45c4de60623848bf';
export const DNA_MINT_CONTRACT_ADDRESS =
  '0x932261f9fc8da46c4a22e31b45c4de60623848bf';

const DNA_ASSETS_BASE_URL =
  'https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets';

/** Image rendered by {@link DnaBanner}, shown before the mint/upgrade flows. */
export const DNA_BANNER_IMAGE = `${DNA_ASSETS_BASE_URL}/dna-banner.png`;

/** Images rendered by {@link MintDna} while animating the DNA layers in. */
export const MINT_DNA_IMAGES = [
  `${DNA_ASSETS_BASE_URL}/dna-6.png`,
  `${DNA_ASSETS_BASE_URL}/dna-5.png`,
  `${DNA_ASSETS_BASE_URL}/dna-4.png`,
  `${DNA_ASSETS_BASE_URL}/dna-3.png`,
  `${DNA_ASSETS_BASE_URL}/dna-2.png`,
  `${DNA_ASSETS_BASE_URL}/dna-1.png`,
];

/** Images rendered by {@link MintDnaWaiting}, shown right after {@link MintDna}. */
export const MINT_DNA_WAITING_IMAGES = [
  `${DNA_ASSETS_BASE_URL}/minting-1.png`,
  `${DNA_ASSETS_BASE_URL}/minting-2.png`,
  `${DNA_ASSETS_BASE_URL}/minting-3.png`,
  `${DNA_ASSETS_BASE_URL}/minting-4.png`,
];
