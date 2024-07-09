import type { AddressAction, Client } from 'defi-sdk';
import { nanoid } from 'nanoid';
import { capitalize } from 'capitalize-ts';
import {
  fetchAssetFromCacheOrAPI,
  type CachedAssetQuery,
} from 'src/modules/defi-sdk/queries';
import type { Networks } from 'src/modules/networks/Networks';
import type { Chain } from 'src/modules/networks/Chain';
import type { BigNumberish } from 'ethers';
import { valueToHex } from 'src/shared/units/valueToHex';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
} from '../../types/IncomingTransaction';
import type { TransactionObject } from '../types';
import type { TransactionActionType } from '../describeTransaction';
import {
  describeTransaction,
  type TransactionAction,
} from '../describeTransaction';
import type { ChainId } from '../ChainId';
import { ZERO_HASH, type LocalAddressAction } from './addressActionMain';

export async function createActionContent(
  action: TransactionAction,
  currency: string,
  client: Client,
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
            currency,
          }
        : {
            isNative: false,
            chain: action.chain,
            address: action.assetAddress,
            currency,
          };
      const asset = await fetchAssetFromCacheOrAPI(query, client);
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
      const asset = await fetchAssetFromCacheOrAPI(
        { isNative: false, chain: action.chain, address: action.assetAddress, currency },
        client
      );
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

export async function pendingTransactionToAddressAction(
  transactionObject: TransactionObject,
  loadNetworkByChainId: (chainId: ChainId) => Promise<Networks>,
  currency: string,
  client: Client
): Promise<LocalAddressAction> {
  const { transaction, hash, receipt, timestamp, dropped } = transactionObject;
  let chain: Chain | null;
  const chainId = normalizeChainId(transaction.chainId);
  const networks = await loadNetworkByChainId(chainId);
  try {
    chain = networks.getChainById(chainId);
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
  const content = action ? await createActionContent(action, currency, client) : null;
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
          valueToHex(transaction.chainId),
      status: receipt
        ? receipt.status === 1
          ? 'confirmed'
          : 'failed'
        : dropped
        ? 'dropped'
        : 'pending',
      fee: null,
      nonce: transaction.nonce || 0,
      sponsored: false,
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
      nonce?: BigNumberish;
      from: string;
    };
  } & Pick<TransactionObject, 'hash' | 'receipt' | 'timestamp' | 'dropped'>,
  transactionAction: TransactionAction,
  networks: Networks,
  currency: string,
  client: Client
): Promise<LocalAddressAction> {
  const { transaction, timestamp } = transactionObject;
  const chain = networks.getChainById(normalizeChainId(transaction.chainId));
  const label = createActionLabel(transaction, transactionAction);
  const content = await createActionContent(transactionAction, currency, client);
  return {
    id: nanoid(),
    local: true,
    address: transaction.from,
    transaction: {
      hash: ZERO_HASH,
      chain: chain.toString(),
      status: 'pending',
      fee: null,
      sponsored: false,
      // nonce can be "BigNumberish" due to
      // ethers types: {import("@ethersproject/abstract-provider").TransactionRequest}
      // Converting bignumber to number cannot be safe, but can nonce be really > MAX_SAFE_INTEGER?
      nonce: (transaction.nonce as number) ?? -1,
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
