import type { Options as KyOptions } from 'ky';
import { isTruthy } from 'is-truthy-ts';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Identity {
  provider: 'ens' | 'lens' | 'ud' | 'unspecified';
  address: string;
  handle: string;
}

interface MigrationToken {
  generation: 'G1' | 'OnePointO';
  id: string;
  premium: {
    expirationTime: string | null;
    plan: 'Single' | 'Bundle';
    features: {
      feeWaiver: boolean;
      csv: boolean;
      pnl: boolean;
      perks: boolean;
      earlyAccess: boolean;
    };
    bundle:
      | {
          address: string;
          updateAllowedAt: string;
        }[]
      | null;
  };
}

export declare type ParentToken = MigrationToken & {
  owner: string;
};

export interface XpDistribution {
  earned: number;
  locked: number;
  referred: number;
}

interface ReferrerNFT {
  chain: string;
  contractAddress: string;
  tokenId: string;
  metadata: {
    name: string | null;
    content: {
      type: string;
      audioUrl: string | null;
      imagePreviewUrl: string | null;
      imageUrl: string | null;
      videoUrl: string | null;
    } | null;
  };
}

interface Referrer {
  referralCode: string;
  address: string | null;
  handle: string | null;
  nft: ReferrerNFT | null;
}

interface NonPremiumTokens {
  id: string;
  generation: 'G1' | 'OnePointO';
}

interface MigrationBalances {
  id: string;
  initial: number;
  remained: number;
}

export interface XpBreakdownItem {
  title: string;
  subtitle: string;
  amount: number;
}

interface XpBreakdown {
  total: number;
  breakdown: XpBreakdownItem[];
}

export interface RetrodropInfo {
  level: number;
  levelProgress: number;
  zerion: XpBreakdown;
  global: XpBreakdown;
}

interface AddressMembership {
  level: number;
  levelProgress: number;
  newRewards: number;
  premium: MigrationToken['premium'] | null;
  migration: {
    balances: MigrationBalances[];
    nonPremiumTokens: NonPremiumTokens[];
    migrationEndTime: string;
    trialEndTime: string;
  } | null;
  referralCode: string | null;
  referralLink: string | null;
  referred: number;
  referrer: Referrer | null;
  retro: RetrodropInfo | null;
  tokens: MigrationToken[] | null;
  parentTokens: ParentToken[] | null;
  xp: XpDistribution;
}

export interface WalletMeta {
  address: string;
  nft: {
    chain: string;
    contractAddress: string;
    tokenId: string;
    metadata: {
      name: string | null;
      content: {
        imagePreviewUrl?: string;
        imageUrl?: string | null;
        audioUrl?: string | null;
        videoUrl?: string | null;
        type: 'video' | 'image' | 'audio';
      } | null;
    } | null;
  } | null;
  nftMetaInformation: {
    onboarded: boolean;
  } | null;
  identities: Identity[];
  membership: AddressMembership;
}

interface Params {
  identifiers: string[];
}

interface Response {
  data: WalletMeta[] | null;
  errors?: { title: string; detail: string }[];
}

function getWalletsMetaInternal(
  { identifiers }: Params,
  kyOptions: KyOptions,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  if (identifiers.every(isSolanaAddress)) {
    // TODO: temporary guard, remove later
    return { data: null, errors: undefined } satisfies Response;
  }
  const params = new URLSearchParams({
    identifiers: identifiers.filter(isEthereumAddress).join(','),
  });
  const endpoint = `wallet/get-meta/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}

export function getWalletsMeta(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const kyOptions = this.getKyOptions();
  return getWalletsMetaInternal(params, kyOptions, options);
}

function splitIntoChunks<T>(arr: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function getWalletsMetaByChunks(
  this: ZerionApiContext,
  addresses: string[]
) {
  const chunks = splitIntoChunks(addresses, 10);
  const kyOptions = this.getKyOptions();
  const results = await Promise.all(
    chunks.map((chunk) =>
      getWalletsMetaInternal({ identifiers: chunk }, kyOptions)
    )
  );
  return results
    .map((response) => response.data)
    .filter(isTruthy)
    .flat();
}
