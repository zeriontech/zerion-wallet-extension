import { capitalize } from 'capitalize-ts';
import type { AddressAction } from 'defi-sdk';
import { ethers } from 'ethers';
import type { Networks } from 'src/modules/networks/Networks';
import type { CachedAssetQuery } from 'src/modules/defi-sdk/queries';
import { fetchAssetFromCacheOrAPI } from 'src/modules/defi-sdk/queries';
import type { Chain } from 'src/modules/networks/Chain';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
} from '../types/IncomingTransaction';
import { getFungibleAsset } from './actionAsset';
import type {
  TransactionAction,
  TransactionActionType,
} from './describeTransaction';
import { describeTransaction } from './describeTransaction';
import type { TransactionObject } from './types';

type ClientTransactionStatus =
  | AddressAction['transaction']['status']
  | 'dropped';

export type PendingAddressAction = Omit<AddressAction, 'transaction' | 'id'> & {
  id: string;
  transaction: Omit<AddressAction['transaction'], 'status'> & {
    hash: string;
    status: ClientTransactionStatus;
  };
};

type IncomingAddressAction = Omit<AddressAction, 'transaction' | 'id'> & {
  id: null;
  transaction: Omit<AddressAction['transaction'], 'hash' | 'nonce'> & {
    hash: null;
    nonce?: number;
  };
};

export type AnyAddressAction = AddressAction | PendingAddressAction;

type AddressActionLabelType = 'to' | 'from' | 'application' | 'contract';

const actionTypeToLabelType: Record<
  TransactionActionType,
  AddressActionLabelType
> = {
  deployment: 'from',
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
    value:
      transaction.to ||
      (action.type === 'deployment' ? '' : action.contractAddress || ''),
    display_value: {
      text: '',
      wallet_address,
      contract_address:
        action.type === 'deployment' ? undefined : action.contractAddress,
    },
  };
}

async function createActionContent(
  action: TransactionAction
): Promise<AddressAction['content'] | null> {
  switch (action.type) {
    case 'deployment':
    case 'execute':
      return null;
    case 'send': {
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
      return asset
        ? {
            transfers: {
              outgoing: [
                {
                  asset: { fungible: asset },
                  quantity: action.amount,
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
      return asset ? { single_asset: { asset: { fungible: asset } } } : null;
    }
  }
}

export async function pendingTransactionToAddressAction(
  transactionObject: TransactionObject,
  networks: Networks
): Promise<PendingAddressAction> {
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
    transaction: {
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
  };
}

export async function incomingTxToIncomingAddressAction(
  transactionObject: {
    transaction: IncomingTransactionWithChainId & { nonce?: number };
  } & Pick<TransactionObject, 'hash' | 'receipt' | 'timestamp' | 'dropped'>,
  networks: Networks
): Promise<IncomingAddressAction> {
  const { transaction, timestamp } = transactionObject;
  const chain = networks.getChainById(
    ethers.utils.hexValue(transaction.chainId)
  );
  const action = describeTransaction(transaction, { networks, chain });
  const label = createActionLabel(transaction, action);
  const content = await createActionContent(action);
  return {
    id: null,
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
      display_value: capitalize(action.type),
      value: action.type,
    },
    content,
  };
}

export function isPendingAddressAction(
  addressAction: AddressAction | PendingAddressAction
): addressAction is PendingAddressAction {
  return addressAction.transaction.status === 'pending';
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
