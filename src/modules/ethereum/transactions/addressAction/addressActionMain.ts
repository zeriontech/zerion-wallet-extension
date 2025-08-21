import type { BigNumberish } from 'ethers';
import { nanoid } from 'nanoid';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type {
  AddressAction,
  ActionChain,
  Amount,
  FungibleOutline,
  NFTPreview,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { invariant } from 'src/shared/invariant';
import type { Asset, NFT } from 'defi-sdk';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Quote2 } from 'src/shared/types/Quote';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from '../../types/IncomingTransaction';

export type LocalActionTransaction = Omit<
  NonNullable<AddressAction['transaction']>,
  'hash'
> & {
  hash: string | null;
};

type LocalAct = Omit<AddressAction['acts'][number], 'transaction'> & {
  transaction: LocalActionTransaction;
};

export type LocalAddressAction = Omit<AddressAction, 'transaction' | 'acts'> & {
  acts: LocalAct[];
  transaction: LocalActionTransaction | null;
  rawTransaction: {
    data?: string | null;
    value?: BigNumberish;
    from?: string | null;
    nonce: number;
    hash: string;
    chain: string;
    gasback?: number | null;
  } | null;
  local: true;
  relatedTransaction?: string; // hash of related transaction (cancelled or sped-up)
};

export type AnyAddressAction = AddressAction | LocalAddressAction;

export function isLocalAddressAction(
  addressAction: AddressAction | LocalAddressAction
): addressAction is LocalAddressAction {
  return 'local' in addressAction && addressAction.local;
}

export const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const toEmptyActionTx = (chain: string): LocalAddressAction['rawTransaction'] =>
  ({
    chain,
    hash: ZERO_HASH,
    nonce: -1,
  } as const);

const toActionTx = (
  tx: IncomingTransaction,
  chain: string
): LocalAddressAction['rawTransaction'] =>
  ({
    ...tx,
    chain,
    hash: (tx as { hash?: string }).hash || ZERO_HASH,
    nonce: -1,
    value: tx.value ?? undefined,
  } as const);

export function convertAssetToFungibleOutline(
  asset: Asset | null
): FungibleOutline | null {
  if (!asset) {
    return null;
  }
  return {
    id: asset.id || asset.asset_code,
    name: asset.name,
    symbol: asset.symbol,
    iconUrl: asset.icon_url || null,
  };
}

function convertNftToNftPreview(nft: NFT): NFTPreview {
  return {
    chain: nft.chain,
    contractAddress: nft.contract_address,
    tokenId: nft.token_id,
    metadata: {
      name: nft.metadata?.name || null,
      content: {
        imagePreviewUrl: nft.metadata?.content?.image_preview_url || null,
      },
    },
  };
}

function convertNetworkToActionChain(network: NetworkConfig): ActionChain {
  return {
    id: network.id,
    name: network.name,
    iconUrl: network.icon_url,
  };
}

export function getExplorerUrl(
  explorerUrlTemplate: string | null,
  hash: string | null
) {
  return hash && explorerUrlTemplate
    ? explorerUrlTemplate.replace('{HASH}', hash)
    : null;
}

export function createSendTokenAddressAction({
  transaction,
  hash,
  sendAsset,
  sendAmount,
  address,
  network,
  receiverAddress,
  explorerUrl,
}: {
  transaction: MultichainTransaction;
  hash: string | null;
  network: NetworkConfig;
  sendAsset: Asset;
  sendAmount: Amount;
  address: string;
  receiverAddress: string;
  explorerUrl: string | null;
}): LocalAddressAction {
  const content = {
    approvals: null,
    transfers: [
      {
        direction: 'out' as const,
        amount: sendAmount,
        fungible: convertAssetToFungibleOutline(sendAsset),
        nft: null,
      },
    ],
  };

  const actionTransaction = {
    chain: convertNetworkToActionChain(network),
    hash,
    explorerUrl,
  };

  return {
    id: nanoid(),
    timestamp: new Date().getTime(),
    address,
    content,
    transaction: actionTransaction,
    acts: [
      {
        content,
        status: 'pending',
        label: {
          contract: null,
          wallet: {
            address: receiverAddress,
            name: null,
            iconUrl: null,
          },
        },
        rate: null,
        transaction: actionTransaction,
        type: {
          value: 'send',
          displayValue: 'Send',
        },
      },
    ],
    status: 'pending',
    type: {
      displayValue: 'Send',
      value: 'send',
    },
    label: {
      contract: null,
      wallet: {
        address: receiverAddress,
        name: null,
        iconUrl: null,
      },
    },
    fee: null,
    gasback: null,
    refund: null,
    local: true,
    rawTransaction: transaction.evm
      ? toActionTx(transaction.evm, network.id)
      : toEmptyActionTx(network.id),
  };
}

export function createSendNFTAddressAction({
  hash,
  transaction,
  network,
  sendAsset,
  sendAmount,
  address,
  receiverAddress,
  explorerUrl,
}: {
  hash: string | null;
  transaction: MultichainTransaction;
  network: NetworkConfig;
  sendAsset: NFT;
  sendAmount: Amount;
  address: string;
  receiverAddress: string;
  explorerUrl: string | null;
}): LocalAddressAction {
  const content = {
    approvals: null,
    transfers: [
      {
        direction: 'out' as const,
        amount: sendAmount,
        fungible: null,
        nft: convertNftToNftPreview(sendAsset),
      },
    ],
  };
  const actionTransaction = {
    chain: convertNetworkToActionChain(network),
    hash,
    explorerUrl,
  };

  return {
    id: nanoid(),
    timestamp: new Date().getTime(),
    address,
    content,
    transaction: actionTransaction,
    acts: [
      {
        content,
        status: 'pending',
        label: {
          contract: null,
          wallet: { address: receiverAddress, name: null, iconUrl: null },
        },
        rate: null,
        transaction: actionTransaction,
        type: {
          value: 'send',
          displayValue: 'Send',
        },
      },
    ],
    status: 'pending',
    type: {
      displayValue: 'Send',
      value: 'send',
    },
    label: {
      contract: null,
      wallet: {
        address: receiverAddress,
        name: null,
        iconUrl: null,
      },
    },
    fee: null,
    gasback: null,
    refund: null,
    local: true,
    rawTransaction: transaction.evm
      ? toActionTx(transaction.evm, network.id)
      : toEmptyActionTx(network.id),
  };
}

export function createTradeAddressAction({
  address,
  transaction,
  hash,
  spendAmount,
  spendAsset,
  receiveAmount,
  receiveAsset,
  network,
  rate,
  explorerUrl,
}: {
  transaction: MultichainTransaction;
  hash: string | null;
  spendAmount: Amount;
  spendAsset: Asset;
  receiveAmount: Amount;
  receiveAsset: Asset;
  address: string;
  network: NetworkConfig;
  rate: Quote2['rate'] | null;
  explorerUrl: string | null;
}): LocalAddressAction {
  const content = {
    approvals: null,
    transfers: [
      {
        direction: 'out' as const,
        amount: spendAmount,
        fungible: convertAssetToFungibleOutline(spendAsset),
        nft: null,
      },
      {
        direction: 'in' as const,
        amount: receiveAmount,
        fungible: convertAssetToFungibleOutline(receiveAsset),
        nft: null,
      },
    ],
  };

  const actionTransaction = {
    chain: convertNetworkToActionChain(network),
    hash,
    explorerUrl,
  };

  return {
    id: nanoid(),
    address,
    timestamp: new Date().getTime(),
    content,
    transaction: actionTransaction,
    acts: [
      {
        content,
        label: null,
        rate,
        status: 'pending',
        type: {
          value: 'trade',
          displayValue: 'Trade',
        },
        transaction: actionTransaction,
      },
    ],
    status: 'pending',
    type: {
      value: 'trade',
      displayValue: 'Trade',
    },
    label: null,
    fee: null,
    gasback: null,
    refund: null,
    local: true,
    rawTransaction: transaction.evm
      ? toActionTx(transaction.evm, network.id)
      : toEmptyActionTx(network.id),
  };
}

export function createBridgeAddressAction({
  address,
  transaction,
  hash,
  spendAmount,
  spendAsset,
  receiveAmount,
  receiveAsset,
  inputNetwork,
  outputNetwork,
  explorerUrl,
  receiverAddress,
}: {
  address: string;
  transaction: MultichainTransaction;
  hash: string | null;
  spendAmount: Amount;
  spendAsset: Asset;
  receiveAmount: Amount;
  receiveAsset: Asset;
  inputNetwork: NetworkConfig;
  outputNetwork: NetworkConfig;
  explorerUrl: string | null;
  receiverAddress: string | null;
}): LocalAddressAction {
  const content = {
    approvals: null,
    transfers: [
      {
        direction: 'out' as const,
        amount: spendAmount,
        fungible: convertAssetToFungibleOutline(spendAsset),
        nft: null,
      },
      {
        direction: 'in' as const,
        amount: receiveAmount,
        fungible: convertAssetToFungibleOutline(receiveAsset),
        nft: null,
      },
    ],
  };

  const actionInputTransaction = {
    chain: convertNetworkToActionChain(inputNetwork),
    hash,
    explorerUrl,
  };

  const actionOutputTransaction = {
    chain: convertNetworkToActionChain(outputNetwork),
    hash,
    explorerUrl,
  };

  return {
    id: nanoid(),
    timestamp: new Date().getTime(),
    address,
    content,
    transaction: actionInputTransaction,
    acts: [
      {
        content,
        label: null,
        rate: null,
        status: 'pending',
        type: {
          value: 'send',
          displayValue: 'Send',
        },
        transaction: actionInputTransaction,
      },
      receiverAddress
        ? {
            content: {
              approvals: null,
              transfers: [
                {
                  direction: 'out',
                  amount: receiveAmount,
                  fungible: convertAssetToFungibleOutline(receiveAsset),
                  nft: null,
                },
              ],
            },
            label: {
              contract: null,
              wallet: {
                address: receiverAddress,
                name: null,
                iconUrl: null,
              },
            },
            rate: null,
            status: 'pending',
            type: {
              value: 'send',
              displayValue: 'Send',
            },
            transaction: actionOutputTransaction,
          }
        : {
            content: {
              approvals: null,
              transfers: [
                {
                  direction: 'in',
                  amount: receiveAmount,
                  fungible: convertAssetToFungibleOutline(receiveAsset),
                  nft: null,
                },
              ],
            },
            label: null,
            rate: null,
            status: 'pending',
            type: {
              value: 'receive',
              displayValue: 'Receive',
            },
            transaction: actionOutputTransaction,
          },
    ],
    status: 'pending',
    type: {
      value: 'send',
      displayValue: receiverAddress ? 'Send' : 'Bridge',
    },
    label: receiverAddress
      ? {
          contract: null,
          wallet: {
            address: receiverAddress,
            name: null,
            iconUrl: null,
          },
        }
      : null,
    fee: null,
    gasback: null,
    refund: null,
    local: true,
    rawTransaction: transaction.evm
      ? toActionTx(transaction.evm, inputNetwork.id)
      : toEmptyActionTx(inputNetwork.id),
  };
}

export function createApproveAddressAction({
  hash,
  transaction,
  asset,
  amount,
  network,
  explorerUrl,
}: {
  hash: string | null;
  transaction: IncomingTransactionWithFrom;
  asset: Asset;
  amount: Amount;
  network: NetworkConfig;
  explorerUrl: string | null;
}): LocalAddressAction {
  const content = {
    approvals: [
      {
        amount,
        fungible: convertAssetToFungibleOutline(asset),
        nft: null,
        collection: null,
        unlimited: false,
      },
    ],
    transfers: null,
  };

  const actionTransaction = {
    chain: convertNetworkToActionChain(network),
    hash,
    explorerUrl,
  };

  return {
    id: nanoid(),
    timestamp: new Date().getTime(),
    address: transaction.from,
    content,
    transaction: actionTransaction,
    acts: [
      {
        content,
        label: null,
        rate: null,
        status: 'pending',
        transaction: actionTransaction,
        type: {
          value: 'approve',
          displayValue: 'Approve',
        },
      },
    ],
    status: 'pending',
    type: {
      value: 'approve',
      displayValue: 'Approve',
    },
    label: null,
    fee: null,
    gasback: null,
    refund: null,
    local: true,
    rawTransaction: toActionTx(transaction, network.id),
  };
}

export function createAcceleratedAddressAction(
  originalAddressAction: LocalAddressAction,
  transaction: IncomingTransaction
): LocalAddressAction {
  invariant(
    originalAddressAction.rawTransaction,
    'Missing initial transaction data to create a cancel transaction'
  );
  const chain = originalAddressAction.rawTransaction.chain;
  return {
    ...originalAddressAction,
    id: nanoid(),
    timestamp: new Date().getTime(),
    local: true,
    rawTransaction: toActionTx(transaction, chain),
    relatedTransaction: originalAddressAction.rawTransaction.hash,
  };
}

export function createCancelAddressAction(
  originalAddressAction: LocalAddressAction,
  transaction: IncomingTransactionWithFrom
): LocalAddressAction {
  invariant(
    originalAddressAction.rawTransaction,
    'Missing initial transaction data to create a cancel transaction'
  );
  const chain = originalAddressAction.rawTransaction.chain;
  const type = { displayValue: 'Send', value: 'send' as const };
  return {
    id: nanoid(),
    timestamp: new Date().getTime(),
    local: true,
    address: transaction.from,
    type,
    label: null,
    content: null,
    rawTransaction: toActionTx(transaction, chain),
    relatedTransaction: originalAddressAction.rawTransaction.hash,
    fee: null,
    gasback: null,
    refund: null,
    status: 'pending',
    transaction: originalAddressAction.transaction,
    acts: originalAddressAction.transaction
      ? [
          {
            content: null,
            label: null,
            rate: null,
            status: 'pending',
            type,
            transaction: originalAddressAction.transaction,
          },
        ]
      : [],
  };
}

export function getActionAddress(action: AnyAddressAction) {
  return action.label?.wallet?.address || action.label?.contract?.address;
}

export function getActionApprovalFungibleId(action: AnyAddressAction) {
  return (
    (action?.acts.length === 1 &&
    action.acts[0].content?.approvals?.length === 1 &&
    !action.acts[0].content.transfers
      ? action.acts[0].content.approvals[0].fungible?.id
      : null) || null
  );
}
