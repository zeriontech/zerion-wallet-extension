import type { Client } from 'defi-sdk';
import { nanoid } from 'nanoid';
import { capitalize } from 'capitalize-ts';
import {
  fetchAssetFromCacheOrAPI,
  type CachedAssetQuery,
} from 'src/modules/defi-sdk/queries';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { valueToHex } from 'src/shared/units/valueToHex';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { v5ToPlainTransactionResponse } from 'src/background/Wallet/model/ethers-v5-types';
import { parseSolanaTransaction } from 'src/modules/solana/transactions/parseSolanaTransaction';
import { invariant } from 'src/shared/invariant';
import { solFromBase64 } from 'src/modules/solana/transactions/create';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { IncomingTransactionWithChainId } from '../../types/IncomingTransaction';
import type { TransactionObject } from '../types';
import type { TransactionActionType } from '../describeTransaction';
import {
  describeTransaction,
  type TransactionAction,
} from '../describeTransaction';
import type { ChainId } from '../ChainId';
import { getTransactionObjectStatus } from '../getTransactionObjectStatus';
import {
  convertAssetToFungible,
  getExplorerUrl,
  ZERO_HASH,
  type LocalAddressAction,
} from './addressActionMain';

export async function createActionContent(
  action: TransactionAction,
  currency: string,
  client: Client
): Promise<AddressAction['content']> {
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
      if (!asset || !action.amount) {
        return null;
      }
      const commonQuantity = baseToCommon(
        action.amount,
        getDecimals({ asset, chain: action.chain })
      );
      return {
        approvals: null,
        transfers: [
          {
            direction: 'out',
            fungible: convertAssetToFungible(asset),
            nft: null,
            amount: {
              currency,
              usdValue: null,
              quantity: commonQuantity.toFixed(),
              value:
                asset.price?.value != null
                  ? commonQuantity.multipliedBy(asset.price.value).toNumber()
                  : null,
            },
          },
        ],
      };
    }
    case 'approve': {
      const asset = await fetchAssetFromCacheOrAPI(
        {
          isNative: false,
          chain: action.chain,
          address: action.assetAddress,
          currency,
        },
        client
      );
      if (!asset) {
        return null;
      }
      const commonQuantity = baseToCommon(
        action.amount,
        getDecimals({ asset, chain: action.chain })
      );
      return {
        transfers: null,
        approvals: [
          {
            fungible: convertAssetToFungible(asset),
            nft: null,
            collection: null,
            unlimited: false,
            amount: {
              currency,
              usdValue: null,
              quantity: commonQuantity.toFixed(),
              value:
                asset.price?.value != null
                  ? commonQuantity.multipliedBy(asset.price.value).toNumber()
                  : null,
            },
          },
        ],
      };
    }
  }
}

type AddressActionLabelType = 'to' | 'from' | 'application';

const actionTypeToLabelType: Record<
  TransactionActionType,
  AddressActionLabelType
> = {
  deploy: 'from',
  send: 'to',
  execute: 'application',
  approve: 'application',
};

function createActionLabel(
  addressAction: TransactionAction
): AddressAction['label'] {
  const title = actionTypeToLabelType[addressAction.type];

  return {
    title,
    displayTitle: capitalize(title),
    wallet:
      addressAction.type === 'send'
        ? {
            address: addressAction.receiverAddress,
            name: addressAction.receiverAddress,
            iconUrl: null,
          }
        : null,
    contract:
      addressAction.type === 'send'
        ? null
        : {
            address: addressAction.contractAddress,
            dapp: {
              id: addressAction.contractAddress,
              name: addressAction.contractAddress,
              iconUrl: null,
              url: null,
            },
          },
  };
}

async function pendingEvmTxToAddressAction(
  transactionObject: TransactionObject,
  loadNetworkByChainId: (chainId: ChainId) => Promise<Networks>,
  currency: string,
  client: Client
): Promise<LocalAddressAction> {
  invariant(transactionObject.hash, 'Must be evm tx');
  const { transaction, hash, timestamp } = transactionObject;
  let network: NetworkConfig | null;
  const chainId = normalizeChainId(transaction.chainId);
  const networks = await loadNetworkByChainId(chainId);
  try {
    network = networks.getNetworkById(chainId);
  } catch (error) {
    if (error instanceof UnsupportedNetwork) {
      network = null;
    } else {
      throw error;
    }
  }
  const normalizedTx = {
    ...v5ToPlainTransactionResponse(transaction),
    chainId,
  };
  const action = network
    ? describeTransaction(normalizedTx, {
        networks,
        chain: createChain(network.id),
      })
    : null;
  const label = action ? createActionLabel(action) : null;
  const content = action
    ? await createActionContent(action, currency, client)
    : null;
  const actionTransaction = {
    hash,
    chain: {
      id: network?.id || valueToHex(transaction.chainId),
      name: network?.name || valueToHex(transaction.chainId),
      iconUrl: network?.icon_url || '',
    },
    explorerUrl: getExplorerUrl(network?.explorer_tx_url || null, hash),
  };
  const type = {
    value: action?.type || 'execute',
    displayValue: capitalize(action?.type || 'execute'),
  };
  return {
    id: hash,
    address: transaction.from,
    status: getTransactionObjectStatus(transactionObject),
    transaction: actionTransaction,
    timestamp: timestamp ?? Date.now(),
    label,
    type,
    refund: null,
    gasback: null,
    fee: null,
    acts: [
      {
        content,
        rate: null,
        status: getTransactionObjectStatus(transactionObject),
        label,
        type,
        transaction: actionTransaction,
      },
    ],
    content,
    rawTransaction: {
      ...normalizedTx,
      hash,
      chain: network
        ? network.id
        : // It's okay to fallback to a stringified chainId because this is
          // only a representational object
          valueToHex(transaction.chainId),
      nonce: Number(transaction.nonce) || 0,
    },
    local: true,
    relatedTransaction: transactionObject.relatedTransactionHash,
  };
}

function pendingSolanaTxToAddressAction(
  transactionObject: TransactionObject,
  currency: string
): LocalAddressAction {
  invariant(transactionObject.signature, 'Must be solana tx');
  const tx = solFromBase64(transactionObject.solanaBase64);
  const action = parseSolanaTransaction(
    transactionObject.publicKey,
    tx,
    currency
  );
  return {
    ...action,
    timestamp: transactionObject.timestamp,
    status: getTransactionObjectStatus(transactionObject),
    local: true,
    rawTransaction: null,
  };
}

export async function pendingTransactionToAddressAction(
  transactionObject: TransactionObject,
  loadNetworkByChainId: (chainId: ChainId) => Promise<Networks>,
  currency: string,
  client: Client
): Promise<LocalAddressAction> {
  if (transactionObject.hash) {
    return pendingEvmTxToAddressAction(
      transactionObject,
      loadNetworkByChainId,
      currency,
      client
    );
  } else if (transactionObject.signature) {
    return pendingSolanaTxToAddressAction(transactionObject, currency);
  } else {
    throw new Error('Unexpected TransactionObject');
  }
}

export async function incomingTxToIncomingAddressAction(
  transactionObject: {
    transaction: IncomingTransactionWithChainId & { from: string };
  } & Pick<TransactionObject, 'hash' | 'receipt' | 'timestamp' | 'dropped'>,
  transactionAction: TransactionAction,
  networks: Networks,
  currency: string,
  client: Client
): Promise<LocalAddressAction> {
  const { transaction, timestamp } = transactionObject;
  const network = networks.getNetworkById(
    normalizeChainId(transaction.chainId)
  );
  const label = createActionLabel(transactionAction);
  const content = await createActionContent(
    transactionAction,
    currency,
    client
  );

  const type = {
    displayValue: capitalize(transactionAction.type),
    value: transactionAction.type,
  };

  const actionTransaction = {
    hash: ZERO_HASH,
    chain: {
      id: network?.id || valueToHex(transaction.chainId),
      name: network?.name || valueToHex(transaction.chainId),
      iconUrl: network?.icon_url || '',
    },
    explorerUrl: null,
  };

  return {
    id: nanoid(),
    local: true,
    address: transaction.from,
    status: 'pending',
    rawTransaction: {
      hash: ZERO_HASH,
      chain: network.id,
      nonce: transaction.nonce ?? -1,
    },
    timestamp: timestamp ?? Date.now(),
    label,
    type,
    content,
    fee: null,
    gasback: null,
    refund: null,
    transaction: actionTransaction,
    acts: [
      {
        content,
        rate: null,
        status: 'pending',
        label,
        type,
        transaction: actionTransaction,
      },
    ],
  };
}
