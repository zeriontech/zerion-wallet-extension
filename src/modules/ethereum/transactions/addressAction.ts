import { capitalize } from 'capitalize-ts';
import type { AddressAction, Asset, NFT, NFTAsset } from 'defi-sdk';
import type { BigNumberish, BytesLike } from 'ethers';
import { ethers } from 'ethers';
import type { Networks } from 'src/modules/networks/Networks';
import type { CachedAssetQuery } from 'src/modules/defi-sdk/queries';
import { fetchAssetFromCacheOrAPI } from 'src/modules/defi-sdk/queries';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import { nanoid } from 'nanoid';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
  IncomingTransactionWithFrom,
} from '../types/IncomingTransaction';
import { getFungibleAsset } from './actionAsset';
import type {
  TransactionAction,
  TransactionActionType,
} from './describeTransaction';
import { describeTransaction } from './describeTransaction';
import type { TransactionObject } from './types';

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

export type IncomingAddressAction = Omit<
  AddressAction,
  'transaction' | 'id'
> & {
  id: null;
  transaction: Omit<AddressAction['transaction'], 'hash' | 'nonce'> & {
    hash: null;
    nonce?: number;
  };
};

const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const toActionTx = (tx: IncomingTransaction, chain: Chain) =>
  ({
    ...tx,
    chain: chain.toString(),
    hash: (tx as { hash?: string }).hash || ZERO_HASH,
    fee: null,
    status: 'pending',
    nonce: -1,
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

type AddressActionLabelType = 'to' | 'from' | 'application' | 'contract';

const actionTypeToLabelType: Record<
  TransactionActionType,
  AddressActionLabelType
> = {
  deploy: 'from',
  send: 'to',
  execute: 'contract',
  approve: 'application',
};

function createActionLabel(
  transaction: IncomingTransaction,
  action: TransactionAction
): AddressAction['label'] {
  let wallet_address = undefined;
  if (action.type === 'send') {
    wallet_address = action.receiverAddress;
  } else if (action.type === 'approve') {
    wallet_address = action.spenderAddress;
  }

  return {
    type: actionTypeToLabelType[action.type],
    value: transaction.to || action.contractAddress || '',
    display_value: {
      text: '',
      wallet_address,
      contract_address: action.contractAddress,
    },
  };
}

async function createActionContent(
  action: TransactionAction
): Promise<AddressAction['content'] | null> {
  switch (action.type) {
    case 'execute':
    case 'send': {
      if (!action.amount) {
        return null;
      }
      const query: CachedAssetQuery = action.isNativeAsset
        ? {
            isNative: true,
            chain: action.chain,
            id: action.assetId,
            address: action.assetAddress,
          }
        : {
            isNative: false,
            chain: action.chain,
            address: action.assetAddress,
          };
      const asset = await fetchAssetFromCacheOrAPI(query);
      return asset && action.amount
        ? {
            transfers: {
              outgoing: [
                {
                  asset: { fungible: asset },
                  quantity: action.amount.toString(),
                  price: null,
                },
              ],
            },
          }
        : null;
    }
    case 'approve': {
      const asset = await fetchAssetFromCacheOrAPI({
        isNative: false,
        chain: action.chain,
        address: action.assetAddress,
      });
      return asset
        ? {
            single_asset: {
              asset: { fungible: asset },
              quantity: action.amount.toString(),
            },
          }
        : null;
    }
  }
}

export async function pendingTransactionToAddressAction(
  transactionObject: TransactionObject,
  networks: Networks
): Promise<LocalAddressAction> {
  const { transaction, hash, receipt, timestamp, dropped } = transactionObject;
  let chain: Chain | null;
  try {
    chain = networks.getChainById(ethers.utils.hexValue(transaction.chainId));
  } catch (error) {
    if (error instanceof UnsupportedNetwork) {
      chain = null;
    } else {
      throw error;
    }
  }
  const action = chain
    ? describeTransaction(transaction, { networks, chain })
    : null;
  const label = action ? createActionLabel(transaction, action) : null;
  const content = action ? await createActionContent(action) : null;
  return {
    id: hash,
    address: transaction.from,
    transaction: {
      ...transaction,
      hash,
      chain: chain
        ? chain.toString()
        : // It's okay to fallback to a stringified chainId because this is
          // only a representational object
          ethers.utils.hexValue(transaction.chainId),
      status: receipt
        ? receipt.status === 1
          ? 'confirmed'
          : 'failed'
        : dropped
        ? 'dropped'
        : 'pending',
      fee: null,
      nonce: transaction.nonce || 0,
    },
    datetime: new Date(timestamp ?? Date.now()).toISOString(),
    label,
    type: action
      ? {
          display_value: capitalize(action.type),
          value: action.type,
        }
      : { display_value: '[Missing network data]', value: 'execute' },
    content,
    local: true,
    relatedTransaction: transactionObject.relatedTransactionHash,
  };
}

export async function incomingTxToIncomingAddressAction(
  transactionObject: {
    transaction: IncomingTransactionWithChainId & {
      nonce?: number;
      from: string;
    };
  } & Pick<TransactionObject, 'hash' | 'receipt' | 'timestamp' | 'dropped'>,
  transactionAction: TransactionAction,
  networks: Networks
): Promise<IncomingAddressAction> {
  const { transaction, timestamp } = transactionObject;
  const chain = networks.getChainById(
    ethers.utils.hexValue(transaction.chainId)
  );
  const label = createActionLabel(transaction, transactionAction);
  const content = await createActionContent(transactionAction);
  return {
    id: null,
    address: transaction.from,
    transaction: {
      hash: null,
      chain: chain.toString(),
      status: 'pending',
      fee: null,
      nonce: transaction.nonce,
    },
    datetime: new Date(timestamp ?? Date.now()).toISOString(),
    label,
    type: {
      display_value: capitalize(transactionAction.type),
      value: transactionAction.type,
    },
    content,
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
