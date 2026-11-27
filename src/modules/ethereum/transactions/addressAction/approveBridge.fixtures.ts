import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { AddressAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { TransactionObject } from '../types';
import type { AnyAddressAction } from './addressActionMain';
import { createApproveAddressAction, createBridgeAddressAction } from './addressActionMain';

/** A USDC approve + Mayan bridge from Ethereum to Arbitrum, as SwapForm2 builds it before signing. */
export const SENDER = '0x52Fb91492000F2a900a6b75B37D588AB37378e59';
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const MAYAN_FORWARDER = '0x337685fdaB40D39bd02028545a4FfA7D287cC3E2';
const APPROVE_PLACEHOLDER_HASH = '0x' + '0'.repeat(64);

export const ethereumNetwork = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: null,
  explorer: null,
} as unknown as NetworkInfo;

export const arbitrumNetwork = {
  id: 'arbitrum',
  name: 'Arbitrum',
  iconUrl: null,
  explorer: null,
} as unknown as NetworkInfo;

export const usdc = {
  id: USDC_ADDRESS.toLowerCase(),
  name: 'USD Coin',
  symbol: 'USDC',
  iconUrl: null,
  verified: true,
  new: false,
  implementations: { ethereum: { address: USDC_ADDRESS.toLowerCase(), decimals: 6 } },
  meta: { price: 1 },
} as unknown as Fungible;

export const arbitrumEth = {
  id: 'eth',
  name: 'Ethereum',
  symbol: 'ETH',
  iconUrl: null,
  verified: true,
  new: false,
  implementations: { arbitrum: { address: null, decimals: 18 } },
  meta: { price: 3000 },
} as unknown as Fungible;

const spendAmount = { currency: 'usd', quantity: '100', value: 100, usdValue: 100 };
const receiveAmount = { currency: 'usd', quantity: '0.0332', value: 99.6, usdValue: 99.6 };

const ethereumChain = { id: 'ethereum', name: 'Ethereum', iconUrl: '' };
const mayanLabel = {
  title: 'application' as const,
  displayTitle: 'Mayan',
  contract: {
    address: MAYAN_FORWARDER,
    dapp: { id: 'mayan', name: 'Mayan', iconUrl: null, url: 'https://mayan.finance' },
  },
};
const bridgeContent = {
  approvals: null,
  transfers: [
    { direction: 'out' as const, amount: spendAmount, fungible: usdc, nft: null },
    { direction: 'in' as const, amount: receiveAmount, fungible: arbitrumEth, nft: null },
  ],
};
const approveContent = {
  transfers: null,
  approvals: [
    { unlimited: false, amount: spendAmount, fungible: usdc, nft: null, collection: null },
  ],
};

/** The simulation's batch interpretation of approve + bridge, including an approve act. */
export const interpretedBridgeWithApprove: AddressAction = {
  id: 'simulation-approve-bridge',
  address: SENDER,
  timestamp: 0,
  status: 'pending',
  type: { value: 'trade', displayValue: 'Bridge' },
  label: mayanLabel,
  fee: {
    free: false,
    amount: { currency: 'usd', quantity: '0.0004', value: 1.2, usdValue: 1.2 },
    fungible: null,
  },
  refund: {
    amount: { currency: 'usd', quantity: '0.0001', value: 0.3, usdValue: 0.3 },
    fungible: null,
  },
  content: bridgeContent,
  transaction: { chain: ethereumChain, hash: APPROVE_PLACEHOLDER_HASH, explorerUrl: null },
  acts: [
    {
      type: { value: 'approve', displayValue: 'Approve' },
      label: mayanLabel,
      content: approveContent,
      rate: null,
      status: 'pending',
      transaction: { chain: ethereumChain, hash: APPROVE_PLACEHOLDER_HASH, explorerUrl: null },
    },
    {
      type: { value: 'trade', displayValue: 'Bridge' },
      label: mayanLabel,
      content: bridgeContent,
      rate: null,
      status: 'pending',
      transaction: { chain: ethereumChain, hash: APPROVE_PLACEHOLDER_HASH, explorerUrl: null },
    },
  ],
};

export const APPROVE_HASH = '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
export const BRIDGE_HASH = '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b';

/** A broadcast, not yet mined Ethereum transaction as the local store keeps it. */
export function createBroadcastTransaction({
  hash,
  nonce,
  to,
  timestamp,
  addressAction,
}: {
  hash: string;
  nonce: number;
  to: string;
  timestamp: number;
  addressAction: AnyAddressAction | null;
}): TransactionObject {
  return {
    hash,
    timestamp,
    initiator: 'test',
    addressAction: addressAction ?? undefined,
    transaction: {
      hash,
      from: SENDER,
      to,
      nonce,
      chainId: 1,
      data: '0x',
      value: '0',
      gasLimit: '100000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '1000000',
      type: 2,
    },
  };
}

export function createFallbackApprove() {
  return createApproveAddressAction({
    transaction: { from: SENDER, to: USDC_ADDRESS, data: '0x095ea7b3', chainId: '0x1' },
    hash: null,
    explorerUrl: null,
    fungible: usdc,
    amount: spendAmount,
    network: ethereumNetwork,
  });
}

export function createFallbackBridge({ onChain }: { onChain: boolean }) {
  return createBridgeAddressAction({
    address: SENDER,
    transaction: onChain
      ? { evm: { from: SENDER, to: MAYAN_FORWARDER, data: '0xabcdef', chainId: '0x1' } }
      : null,
    hash: null,
    explorerUrl: null,
    spendFungible: usdc,
    spendAmount,
    receiveFungible: arbitrumEth,
    receiveAmount,
    inputNetwork: ethereumNetwork,
    outputNetwork: arbitrumNetwork,
    receiverAddress: SENDER,
  });
}
