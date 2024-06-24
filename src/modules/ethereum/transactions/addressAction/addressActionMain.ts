import type { AddressAction, Asset, NFT, NFTAsset } from 'defi-sdk';
import type { BigNumberish, BytesLike } from 'ethers';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import { nanoid } from 'nanoid';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from '../../types/IncomingTransaction';
import { getFungibleAsset } from '../actionAsset';

export type ClientTransactionStatus =
  | AddressAction['transaction']['status']
  | 'dropped';

export type LocalAddressAction = Omit<AddressAction, 'transaction'> & {
  transaction: Omit<AddressAction['transaction'], 'status'> & {
    status: ClientTransactionStatus;
    data?: BytesLike;
    value?: BigNumberish;
    from?: string;
  };
  local: true;
  relatedTransaction?: string; // hash of related transaction (cancelled or sped-up)
};

export type AnyAddressAction = AddressAction | LocalAddressAction;

export function isLocalAddressAction(
  addressAction: AnyAddressAction
): addressAction is LocalAddressAction {
  return 'local' in addressAction && addressAction.local;
}

export const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const toActionTx = (
  tx: IncomingTransaction,
  chain: Chain
): AddressAction['transaction'] =>
  ({
    ...tx,
    chain: chain.toString(),
    hash: (tx as { hash?: string }).hash || ZERO_HASH,
    fee: null,
    status: 'pending',
    nonce: -1,
    sponsored: false,
  } as const);

function isAsset(x: Asset | NFT): x is Asset {
  return 'asset_code' in x && 'decimals' in x && 'symbol' in x;
}
function isNFT(x: Asset | NFT): x is NFT {
  return 'contract_address' in x && 'token_id' in x;
}

function toNftAsset(x: NFT): NFTAsset {
  return {
    ...x,
    asset_code: `${x.contract_address}:${x.token_id}`,
    name: x.metadata.name,
    symbol: '',
    preview: { url: null, meta: null },
    detail: { url: null, meta: null },
    interface: x.contract_standard,
    type: 'nft',
    price: null,
    icon_url: null,
    is_verified: false,
    collection_info: null,
    tags: null,
    floor_price: x.prices.converted?.floor_price ?? 0,
    last_price: 0,
  };
}

export function createSendAddressAction({
  transaction,
  asset,
  quantity,
  chain,
}: {
  transaction: IncomingTransactionWithFrom;
  asset: Asset | NFT;
  quantity: string;
  chain: Chain;
}): LocalAddressAction {
  return {
    id: nanoid(),
    datetime: new Date().toISOString(),
    address: transaction.from,
    type: { display_value: 'Send', value: 'send' },
    label: null,
    transaction: toActionTx(transaction, chain),
    content: {
      transfers: {
        outgoing: isAsset(asset)
          ? [
              {
                asset: { fungible: asset },
                quantity,
                price: asset.price?.value ?? null,
              },
            ]
          : isNFT(asset)
          ? [
              {
                asset: { nft: toNftAsset(asset) },
                quantity,
                price: asset.prices.converted?.floor_price ?? null,
              },
            ]
          : [],
        incoming: [],
      },
    },
    local: true,
  };
}

type AssetQuantity = { asset: Asset; quantity: string };

export function createTradeAddressAction({
  transaction,
  outgoing,
  incoming,
  chain,
}: {
  transaction: IncomingTransactionWithFrom;
  outgoing: AssetQuantity[];
  incoming: AssetQuantity[];
  chain: Chain;
}): LocalAddressAction {
  return {
    id: nanoid(),
    datetime: new Date().toISOString(),
    address: transaction.from,
    type: { value: 'trade', display_value: 'Trade' },
    transaction: toActionTx(transaction, chain),
    label: null,
    content: {
      transfers: {
        outgoing: outgoing.map(({ asset, quantity }) => ({
          asset: { fungible: asset },
          quantity,
          price: asset.price?.value ?? null,
        })),
        incoming: incoming.map(({ asset, quantity }) => ({
          asset: { fungible: asset },
          quantity,
          price: asset.price?.value ?? null,
        })),
      },
    },
    local: true,
  };
}

export function createApproveAddressAction({
  transaction,
  asset,
  quantity,
  chain,
}: {
  transaction: IncomingTransactionWithFrom;
  asset: Asset;
  quantity: string;
  chain: Chain;
}): LocalAddressAction {
  return {
    id: nanoid(),
    address: transaction.from,
    datetime: new Date().toISOString(),
    type: { value: 'approve', display_value: 'Approve' },
    transaction: toActionTx(transaction, chain),
    label: null,
    content: { single_asset: { asset: { fungible: asset }, quantity } },
    local: true,
  };
}

export function createAcceleratedAddressAction(
  addressAction: AnyAddressAction,
  transaction: IncomingTransaction
): LocalAddressAction {
  const chain = createChain(addressAction.transaction.chain);
  return {
    ...addressAction,
    id: nanoid(),
    datetime: new Date().toISOString(),
    local: true,
    transaction: toActionTx(transaction, chain),
    relatedTransaction: addressAction.transaction.hash,
  };
}

export function createCancelAddressAction(
  originalAddressAction: AnyAddressAction,
  transaction: IncomingTransactionWithFrom
): LocalAddressAction {
  const chain = createChain(originalAddressAction.transaction.chain);
  return {
    id: nanoid(),
    datetime: new Date().toISOString(),
    local: true,
    address: transaction.from,
    type: { display_value: 'Send', value: 'send' },
    label: null,
    content: null,
    transaction: toActionTx(transaction, chain),
    relatedTransaction: originalAddressAction.transaction.hash,
  };
}

export function getActionAsset(action: AnyAddressAction) {
  const approvedAsset = action.content?.single_asset?.asset;
  const sentAsset = action.content?.transfers?.outgoing?.[0]?.asset;

  if (approvedAsset) {
    return getFungibleAsset(approvedAsset);
  } else if (sentAsset) {
    return getFungibleAsset(sentAsset);
  }
  return null;
}

export function getActionAddress(action: AnyAddressAction) {
  return (
    action.label?.display_value.wallet_address ||
    action.label?.display_value.contract_address
  );
}
