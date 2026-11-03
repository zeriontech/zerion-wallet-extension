import { produce } from 'immer';
import { invariant } from 'src/shared/invariant';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { Fungible } from '../types/Fungible';
import type { SignedPermit } from './wallet-prepare-permits';
import {
  type PENDING_ACTION_STATUSES,
  normalizePendingLists,
} from './wallet-get-actions-pending.normalize';

export type NFTPreview = {
  /**
   * @description Chain identifier on which the nft is located // [!code link {"token":"Chain","href":"/docs/actions/entities.html#chain"}]
   * @example ethereum
   */
  chain: string;
  /**
   * @description Address of a smart contract of the NFT // [!code link {"token":"NFT","href":"/docs/actions/entities.html#nft"}]
   * @example 0x932261f9fc8da46c4a22e31b45c4de60623848bf
   */
  contractAddress: string;
  /**
   * @description Identifier of the NFT // [!code link {"token":"NFT","href":"/docs/actions/entities.html#nft"}]
   * @example 5555
   */
  tokenId: string;
  /** @description Metadata of NFT */
  metadata: {
    /**
     * @description Name of the NFT // [!code link {"token":"NFT","href":"/docs/actions/entities.html#nft"}]
     * @example #5555
     */
    name: string | null;
    content: {
      /**
       * Format: uri
       * @description Url to attached preview image
       * @example https://lh3.googleusercontent.com/1shEuaYwl9TQKi_GEMVDXITwraVvqynajZdwmJlJwVCn78JTeIuCbMJMtgug8wPYMZaDaYPnqgMlkuPlv-jgH0xwVvJWQYlCEZvT=s250
       */
      imagePreviewUrl: string | null;
    } | null;
  } | null;
};

export type Collection = {
  /** @description Unique identifier for the collection */
  id: null | string;
  /** @description Human-readable name of the collection */
  name: null | string;
  /** @description URL to the collection's logo */
  iconUrl: null | string;
};

export type ActionType =
  | 'execute'
  | 'send'
  | 'receive'
  | 'mint'
  | 'burn'
  | 'deposit'
  | 'withdraw'
  | 'trade'
  | 'approve'
  | 'revoke'
  | 'deploy'
  | 'cancel'
  | 'borrow'
  | 'repay'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'batch_execute';

export interface Payload {
  /**
   * @description Currency name for price conversions // [!code link {"token":"Currency","href":"/docs/actions/entities.html#currency"}]
   * @example usd
   */
  currency: string;
  /** @description Wallet addresses */
  addresses: string[];
  /**
   * Signed decryption permits unlocking confidential transfer amounts. Send
   * every permit held for the requested wallets; capped at 10 per request.
   */
  permits?: SignedPermit[];
  /** @description Pagination cursor */
  cursor?: string;
  /** @description Pagination limit */
  limit?: number;
  /**
   * @description Chain identifier on which the nft is located // [!code link {"token":"Chain","href":"/docs/actions/entities.html#chain"}]
   * @example ethereum
   */
  chain?: string;
  /** @description Filter by types of actions */
  actionTypes?: ActionType[];
  /** @description Filter by types of assets */
  assetTypes?: ('fungible' | 'nft')[];
  /** @description Filter by asset id for fungible assets */
  fungibleId?: string;
  /** @description Search query */
  searchQuery?: string;
  /** @description Include spam transactions */
  includeSpam?: boolean;
  /** @description Return the pending and unsigned lists. Sent only on the first page, never with a cursor. */
  includePending?: boolean;
  /** @description Unix timestamp (seconds). Only actions mined at or after it are returned. */
  since?: number;
}

type Wallet = {
  /** @example test.zerion.eth */
  name: string | null;
  /** @example https://lh3.googleusercontent.com/MtCGsfm3h_n9wjzVloLzF4ocL4nhU9iYL81HKpZ4wZxCF6bwB2RFmK6hI7EO_fmPwPKjAx-d-qKsqNrVjn2jbJLibAW0-nBqYQ=s250 */
  iconUrl: string | null;
  /** @example 0x42b9df65b219b3dd36ff330a4dd8f327a6ada990 */
  address: string;
  /** @example false */
  premium?: boolean;
  /** @description Indicates if this label is clickable in the UI */
  trackable?: boolean;
};

type DApp = {
  /**
   * @description Unique identifier for the DApp // [!code link {"token":"DApp","href":"/docs/actions/entities.html#dapp"}]
   * @example uniswap-v2
   */
  id: string;
  /**
   * @description Name of the DApp // [!code link {"token":"DApp","href":"/docs/actions/entities.html#dapp"}]
   * @example Uniswap V2
   */
  name: string;
  /**
   * @description URL to the DApp's icon // [!code link {"token":"DApp","href":"/docs/actions/entities.html#dapp"}]
   * @example https://protocol-icons.s3.amazonaws.com/icons/uniswap-v2.jpg
   */
  iconUrl: string | null;
  /**
   * @description URL to the DApp's website // [!code link {"token":"DApp","href":"/docs/actions/entities.html#dapp"}]
   * @example https://app.uniswap.org/
   */
  url: string | null;
};

export type ActionLabel = {
  /**
   * @description Internal title for rendering
   * @enum {string}
   */
  title?: 'to' | 'from' | 'application';
  /** @description Human-readable display title in English, to be used as a fallback when title is unknown */
  displayTitle?: string;
  wallet?: null | Wallet;
  contract: null | {
    address: string;
    dapp: DApp;
  };
};

export type Amount = {
  currency: string;
  /** @description Amount in common units (like token units) */
  quantity: string;
  /** @description Amount in fiat units */
  value: number | null;
  /** @description Amount in USD */
  usdValue: number | null;
  /**
   * @description Confidential (e.g. Zama FHE) amount: encrypted on-chain and
   * returned zeroed until a matching Signed Permit is attached to the request
   */
  encrypted?: boolean;
};

type Fee = {
  /** @description Whether the network fee is free */
  free: boolean;
  /** @description Fee amount (can be expected fee or max fee) */
  amount: Amount;
  fungible: null | Fungible;
};

export type ActionFee = Fee;

export type ActionDirection = 'in' | 'out';

export type Transfer = {
  direction: ActionDirection;
  amount: null | Amount;
  fungible: null | Fungible;
  nft: null | NFTPreview;
};

export type Approval = {
  /** @description Whether the amount is unlimited */
  unlimited: boolean;
  /** @description Approval amount, null if unlimited or collection/erc721 approval */
  amount: null | Amount;
  fungible: null | Fungible;
  nft: null | NFTPreview;
  collection: null | Collection;
};

type Content = {
  transfers: null | Transfer[];
  approvals: null | Approval[];
};

export type ActionContent = Content;

type Chain = {
  id: string;
  /**
   * @description Name of the chain
   * @example Ethereum
   */
  name: string;
  /**
   * @description URL to the chain's icon
   * @example https://example.com/icon.png
   */
  iconUrl: string | null;
};

export type ActionChain = Chain;

export type ActionTransaction = {
  chain: Chain;
  /** @description Unique identifier for the transaction, hash for EVM, signature for Solana */
  hash: string;
  /** @description URL to the transaction on the blockchain explorer */
  explorerUrl: null | string;
  /** @description Sender's nonce (uint64); null when upstream has none and always null on Solana */
  nonce?: number | null;
  /** @description Sender address; null when upstream has none */
  sender?: string | null;
};

type Rate = {
  value: number;
  symbol: string;
}[];

export type ActionRate = Rate;

export type ActionStatus = 'confirmed' | 'failed' | 'pending' | 'dropped';

type Act = {
  type: { value: ActionType; displayValue: string };
  label: ActionLabel | null;
  content: Content | null;
  /** @description Exchange rate, non-null only for Trade acts with exactly 2 transfers */
  rate: null | Rate;
  /**
   * @description Act status // [!code link {"token":"Act","href":"/docs/actions/entities.html#act"}]
   * @enum {string}
   */
  status: ActionStatus;
  transaction: ActionTransaction;
};

type Action = {
  address: string;
  /** @description Unique identifier for the action */
  id: string;
  /** @description Unix timestamp of the action */
  timestamp: number;
  /**
   * @description Action status // [!code link {"token":"Action","href":"/docs/actions/entities.html#action"}]
   * @enum {string}
   */
  status: ActionStatus;
  type: { value: ActionType; displayValue: string };
  label: ActionLabel | null;
  /** @description Fee */
  fee: null | Fee;
  /** @description Refund */
  refund: null | {
    /** @description Refund amount */
    amount: Amount;
    fungible: null | Fungible;
  };
  acts: Act[] | null;
  content: Content | null;
  transaction: ActionTransaction | null;
};

export type AddressAction = Action;

export type ActionWithoutTimestamp = Omit<Action, 'timestamp'>;

export type PendingActionStatus = (typeof PENDING_ACTION_STATUSES)[number];

export type PendingAct = Omit<Act, 'status'> & {
  status: ActionStatus | PendingActionStatus | '';
};

/** The transaction of a wire pending act: `hash` is null until the act is broadcast (zpi#357, WLT-2923). */
export type PendingActTransactionWire = Omit<
  PendingAct['transaction'],
  'hash'
> & {
  hash: string | null;
};

/** One act of a wire `pending` or `unsigned` row: `status` is '' in revision 1 of the contract and absent in revision 2 (zpi-ref#241); `transaction` is tolerated absent or null. */
export type PendingActWire = Omit<PendingAct, 'status' | 'transaction'> & {
  status?: PendingAct['status'];
  transaction?: PendingActTransactionWire | null;
};

/** One row of the wire `pending` or `unsigned` list (seconds). The key is `id`; `status` is null in revision 1 of the contract and absent in revision 2 (zpi-ref#241). */
export type PendingActionWire = Omit<Action, 'status' | 'acts'> & {
  status?: string | null;
  acts: PendingActWire[];
  /** @description Unix timestamp in seconds */
  availableAt?: number | null;
  /** @description Unix timestamp in seconds */
  expiresAt?: number | null;
};

/** A normalized row of the response `pending` or `unsigned` list (milliseconds). */
export type PendingAction = Omit<Action, 'status' | 'acts'> & {
  /** @description Set by the normalizer to the list it came from */
  status: PendingActionStatus;
  acts: PendingAct[];
  /** @description The wire `id`, an opaque id that is never parsed, also kept in `id` */
  pendingActionId: string;
  /** @description Order creation time, unix timestamp in ms */
  timestamp: number;
  /** @description Unix timestamp in ms */
  availableAt: number | null;
  /** @description Unix timestamp in ms */
  expiresAt: number | null;
};

export interface Response {
  data: Action[];
  /** @description Pending list; [] when the backend omitted it */
  pending: PendingAction[];
  /** @description Unsigned list; [] when the backend omitted it */
  unsigned: PendingAction[];
  /** @description true only when the backend sent both `pending` and `unsigned` as lists; null (could not load) or omitted is false */
  pendingListsAvailable: boolean;
  meta: {
    pagination: {
      /**
       * @description Cursor can contain any type of information; clients should not rely on its contents, but should simply send it as it is. // [!code link {"token":"Cursor","href":"/docs/actions/entities.html#cursor"}]
       * @example 10
       */
      cursor: string;
    };
  } | null;
  errors?: { title: string; detail: string }[];
}

/** The wire response: `pending` and `unsigned` are absent on cursor pages and without includePending, and both null when the backend could not load them. */
export type WalletActionsWireResponse = Omit<
  Response,
  'pending' | 'unsigned' | 'pendingListsAvailable'
> & {
  pending?: PendingActionWire[] | null;
  unsigned?: PendingActionWire[] | null;
};

export {
  PENDING_ACTION_STATUSES,
  normalizePendingList,
} from './wallet-get-actions-pending.normalize';

export async function walletGetActions(
  this: ZerionApiContext,
  params: Payload,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  invariant(params.addresses.length > 0, 'Addresses param is empty');
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/get-actions/v1';
  const { includePending, ...rest } = params;
  const body: Payload =
    includePending && !params.cursor ? { ...rest, includePending } : rest;
  const result = await ZerionHttpClient.post<WalletActionsWireResponse>(
    {
      endpoint,
      body: JSON.stringify(body),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
  const { pending, unsigned, ...actions } = result;
  return {
    ...produce(actions, (draft) => {
      draft.data.forEach((action) => {
        action.timestamp = action.timestamp * 1000;
      });
    }),
    ...normalizePendingLists({ pending, unsigned }),
  };
}
