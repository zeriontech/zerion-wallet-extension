/**
 * Vendored copies of the `defi-sdk` data shapes that outlive the package.
 *
 * These are verbatim ports of the interfaces `defi-sdk` used to export, kept
 * here so the extension's type dependency on the package is severed
 * independently of its runtime dependency (the socket client). Nothing in this
 * file is authored: if a shape looks wrong, it is wrong in the same way the
 * backend response was.
 *
 * Deliberately NOT vendored:
 * - `CachePolicy`, `Result` — defi-sdk request mechanics, not data shapes.
 *   They disappear along with the socket domains rather than move here.
 * - `AddressMembership` — goes away with `useAddressMembership.ts`.
 *
 * New code should prefer the `src/modules/zerion-api` response types.
 */

/* -------------------------------------------------------------------------- */
/* Asset                                                                      */
/* -------------------------------------------------------------------------- */

interface Price {
  value: number;
  relative_change_24h: number;
  changed_at: number;
}

export interface Asset {
  id: string;
  asset_code: string;
  decimals: number;
  icon_url: string | null;
  name: string;
  price: Price | null;
  symbol: string;
  type: string | null;
  is_displayable: boolean;
  is_verified: boolean;
  addresses?: {
    [key: string]: string;
  };
  implementations?: {
    [key: string]: {
      address: string | null;
      decimals: number;
    };
  };
}

/* -------------------------------------------------------------------------- */
/* AddressPosition                                                            */
/* -------------------------------------------------------------------------- */

export type PositionType =
  | 'asset'
  | 'deposit'
  | 'loan'
  | 'reward'
  | 'staked'
  | 'locked';

export interface AddressPositionDappInfo {
  id: string;
  name: string | null;
  url: string | null;
  icon_url: string | null;
}

export interface AddressPosition {
  apy: string | null;
  asset: Asset;
  chain: string;
  id: string;
  included_in_chart: boolean;
  name: string;
  parent_id: string | null;
  protocol: string | null;
  quantity: string | null;
  type: PositionType;
  value: string | null;
  is_displayable: boolean;
  dapp: AddressPositionDappInfo | null;
}

/* -------------------------------------------------------------------------- */
/* NFT                                                                        */
/* -------------------------------------------------------------------------- */

interface MediaContentValue {
  image_preview_url?: string;
  image_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  type: 'video' | 'image' | 'audio';
}

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
  id: number;
  name?: string;
  description?: string;
  icon_url?: string;
  payment_token_symbol?: string;
  slug?: string;
}

export interface NFT {
  contract_address: string;
  contract_standard: 'ERC721' | 'ERC1155' | 'CRYPTOPUNKS';
  token_id: string;
  chain: string;
  metadata: NFTMetadata;
  collection: NFTCollection;
  prices: NFTPrice;
  relevant_urls?: {
    name: string;
    url: string;
  }[];
}

export interface AddressNFT extends NFT {
  changed_at?: number;
  amount?: number;
}

/* -------------------------------------------------------------------------- */
/* NFTAsset                                                                   */
/* -------------------------------------------------------------------------- */

interface NFTCollectionInfo {
  description: string | null;
  icon_url: string | null;
  name: string;
  slug: string;
}

interface NFTContent {
  url: string | null;
  meta: null | {
    [key: string]: string;
  };
}

export interface NFTAsset {
  asset_code: string;
  name: string;
  symbol: string;
  preview: NFTContent;
  detail: NFTContent;
  interface: string;
  contract_address: string;
  token_id: string;
  type: 'nft';
  price: null | {
    value: number;
  };
  icon_url: string | null;
  is_verified: boolean;
  collection: NFTCollection | null;
  collection_info: NFTCollectionInfo | null;
  tags: string | null;
  floor_price: number;
  last_price: number;
}

/* -------------------------------------------------------------------------- */
/* AddressAction                                                              */
/* -------------------------------------------------------------------------- */

type TransactionStatus = 'confirmed' | 'failed' | 'pending';

type ActionType =
  | 'send'
  | 'receive'
  | 'trade'
  | 'approve'
  | 'revoke'
  | 'execute'
  | 'deploy'
  | 'cancel'
  | 'deposit'
  | 'withdraw'
  | 'borrow'
  | 'repay'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'mint'
  | 'burn';

export type ActionAsset =
  | {
      fungible: Asset | Record<string, never>;
    }
  | {
      nft: NFTAsset | Record<string, never>;
    };

interface ActionTransfer {
  asset: ActionAsset;
  quantity: string;
  price: number | null;
  recipient?: string | null;
  sender?: string | null;
}

interface ActionTransfers {
  outgoing?: ActionTransfer[];
  incoming?: ActionTransfer[];
}

interface ApprovalNFTCollection extends Omit<NFTCollection, 'id'> {
  id: string;
}

export interface AddressAction {
  id: string;
  datetime: string;
  address: string;
  type: {
    value: ActionType;
    display_value: string;
  };
  transaction: {
    chain: string;
    hash: string;
    status: TransactionStatus;
    nonce: number;
    sponsored: boolean;
    fee: {
      asset: ActionAsset;
      quantity: string;
      price: number | null;
    } | null;
    gasback?: number | null;
  };
  label: {
    type: 'to' | 'from' | 'application' | 'contract';
    value: string;
    icon_url?: string;
    display_value: {
      wallet_address?: string;
      contract_address?: string;
      text?: string;
    };
  } | null;
  content: {
    transfers?: ActionTransfers;
    single_asset?: {
      asset: ActionAsset;
      quantity: string;
    };
    collection?: ApprovalNFTCollection;
  } | null;
}

/* -------------------------------------------------------------------------- */
/* Request params                                                             */
/* -------------------------------------------------------------------------- */

export type AddressParams = { address: string } | { addresses: string[] };
