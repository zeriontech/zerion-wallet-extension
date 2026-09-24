import { nanoid } from 'nanoid';
import { capitalize } from 'capitalize-ts';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { valueToHex } from 'src/shared/units/valueToHex';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { v5ToPlainTransactionResponse } from 'src/background/Wallet/model/ethers-v5-types';
import { parseSolanaTransaction } from 'src/modules/solana/transactions/parseSolanaTransaction';
import { invariant } from 'src/shared/invariant';
import { solFromBase64 } from 'src/modules/solana/transactions/create';
import type { Asset } from 'src/defi-sdk.types';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { IncomingTransactionWithChainId } from '../../types/IncomingTransaction';
import type { TransactionObject } from '../types';
import type { TransactionActionType } from '../describeTransaction';
import {
  describeTransaction,
  type TransactionAction,
} from '../describeTransaction';
import type { ChainId } from '../ChainId';
import { getTransactionObjectStatus } from '../getTransactionObjectStatus';
import { fetchAssetFromAPI, type AssetQuery } from './fetchAssetFromAPI';
import {
  convertAssetToFungible,
  getExplorerUrl,
  ZERO_HASH,
  type LocalAddressAction,
} from './addressActionMain';

export function getActionAssetQuery(
  action: TransactionAction,
  currency: string
): AssetQuery | null {
  switch (action.type) {
    case 'execute':
    case 'send': {
      if (!action.amount) {
        return null;
      }
      return action.isNativeAsset
        ? {
            isNative: true,
            id: action.assetId,
            address: action.assetAddress,
            currency,
          }
        : {
            isNative: false,
            address: action.assetAddress,
            currency,
          };
    }
    case 'revoke':
    case 'approve': {
      return { isNative: false, address: action.assetAddress, currency };
    }
  }
}

export function buildActionContent(
  action: TransactionAction,
  asset: Asset,
  currency: string
): AddressAction['content'] {
  switch (action.type) {
    case 'execute':
    case 'send': {
      if (!action.amount) {
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
    case 'revoke': {
      return {
        transfers: null,
        approvals: [
          {
            fungible: convertAssetToFungible(asset),
            nft: null,
            collection: null,
            unlimited: false,
            amount: null,
          },
        ],
      };
    }
    case 'approve': {
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

export async function createActionContent(
  action: TransactionAction,
  currency: string,
  source: NetworksSource
): Promise<AddressAction['content']> {
  const query = getActionAssetQuery(action, currency);
  if (!query) {
    return null;
  }
  const asset = await fetchAssetFromAPI(query, source);
  return asset ? buildActionContent(action, asset, currency) : null;
}

/**
 * Describes the asset lookup a local action still needs before its content
 * can be shown. History resolves it per row, only once the row is on screen.
 */
export type LocalActionContentRequest = {
  transactionAction: TransactionAction;
  assetQuery: AssetQuery;
  /** Whether the only act was built locally and should get the content too */
  fillActs: boolean;
};

export function applyLocalActionContent(
  addressAction: LocalAddressAction,
  request: LocalActionContentRequest,
  content: AddressAction['content']
): LocalAddressAction {
  return {
    ...addressAction,
    content,
    acts: request.fillActs
      ? addressAction.acts?.map((act) => ({ ...act, content })) ?? null
      : addressAction.acts,
  };
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
  revoke: 'application',
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

export type LocalActionWithContentRequest = {
  addressAction: LocalAddressAction;
  contentRequest: LocalActionContentRequest | null;
};

/**
 * Builds the local action without any network requests. When the stored
 * interpretation has no content, the asset lookup is described in
 * `contentRequest` instead of being performed here.
 */
async function pendingEvmTxToAddressAction(
  transactionObject: TransactionObject,
  loadNetworkByChainId: (chainId: ChainId) => Promise<Networks>,
  currency: string
): Promise<LocalActionWithContentRequest> {
  invariant(transactionObject.hash, 'Must be evm tx');
  const { transaction, hash, timestamp, addressAction } = transactionObject;
  let network: NetworkInfo | null;
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
  const assetQuery =
    action && !addressAction?.content
      ? getActionAssetQuery(action, currency)
      : null;
  const contentRequest =
    action && assetQuery
      ? {
          transactionAction: action,
          assetQuery,
          fillActs: !addressAction?.acts,
        }
      : null;
  const content = addressAction?.content || null;
  const actionTransaction = {
    hash,
    chain: {
      id: network?.id || valueToHex(transaction.chainId),
      name: network?.name || valueToHex(transaction.chainId),
      iconUrl: network?.iconUrl || '',
    },
    explorerUrl: getExplorerUrl(network?.explorer?.txUrl || null, hash),
  };
  const type = {
    value: action?.type || 'execute',
    displayValue: capitalize(action?.type || 'execute'),
  };
  const acts = [
    {
      content,
      rate: null,
      status: getTransactionObjectStatus(transactionObject),
      label,
      type,
      transaction: actionTransaction,
    },
  ];
  const localAddressAction: LocalAddressAction = {
    id: hash,
    address: transaction.from,
    timestamp: timestamp ?? Date.now(),
    status: getTransactionObjectStatus(transactionObject),
    transaction: actionTransaction,
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
    label: addressAction?.label || label,
    type: addressAction?.type || type,
    refund: addressAction?.refund || null,
    fee: addressAction?.fee || null,
    acts: addressAction?.acts || acts,
    content,
  };
  return { addressAction: localAddressAction, contentRequest };
}

function pendingSolanaTxToAddressAction(
  transactionObject: TransactionObject,
  currency: string
): LocalAddressAction {
  invariant(transactionObject.signature, 'Must be solana tx');
  const tx = solFromBase64(transactionObject.solanaBase64);
  const action =
    transactionObject.addressAction ||
    parseSolanaTransaction(transactionObject.publicKey, tx, currency);
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
  currency: string
): Promise<LocalActionWithContentRequest> {
  if (transactionObject.hash) {
    return pendingEvmTxToAddressAction(
      transactionObject,
      loadNetworkByChainId,
      currency
    );
  } else if (transactionObject.signature) {
    return {
      addressAction: pendingSolanaTxToAddressAction(
        transactionObject,
        currency
      ),
      contentRequest: null,
    };
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
  source: NetworksSource
): Promise<LocalAddressAction> {
  const { transaction, timestamp } = transactionObject;
  const network = networks.getNetworkById(
    normalizeChainId(transaction.chainId)
  );
  const label = createActionLabel(transactionAction);
  const content = await createActionContent(
    transactionAction,
    currency,
    source
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
      iconUrl: network?.iconUrl || '',
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
