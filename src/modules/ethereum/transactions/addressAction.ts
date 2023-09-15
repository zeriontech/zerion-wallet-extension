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

export type ClientTransactionStatus =
  | AddressAction['transaction']['status']
  | 'dropped';

export type LocalAddressAction = Omit<AddressAction, 'transaction'> & {
  transaction: Omit<AddressAction['transaction'], 'status'> & {
    hash: string;
    status: ClientTransactionStatus;
  };
  local: true;
};

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

export type AnyAddressAction = AddressAction | LocalAddressAction;

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
    local: true,
  };
}

export async function incomingTxToIncomingAddressAction(
  transactionObject: {
    transaction: IncomingTransactionWithChainId & { nonce?: number };
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
