import type { Fungible } from './Fungible';

export type ChainSpecification = {
  /** EVM-compatible chain specification (EIP-155) */
  eip155?: null | {
    /** EIP-155 numeric chain ID */
    chainId: number;
  };
  /** Solana chain specification */
  solana?: null | {
    /** Genesis block hash */
    genesisHash: string;
  };
  /** Tron chain specification */
  tron?: null | {
    /** Tron chain ID */
    chainId: number;
  };
};

export type ChainExplorer = {
  /** Name of the block explorer */
  name: string;
  /** URL template for transaction lookup */
  txUrl: string;
  /** URL template for token lookup */
  tokenUrl: string;
  /** Home URL of the block explorer */
  homeUrl: string;
  /** URL template for address lookup */
  addressUrl: string;
};

export type ChainFlags = {
  supportsTrading: boolean;
  supportsSending: boolean;
  supportsBridging: boolean;
  supportsActions: boolean;
  supportsPositions: boolean;
  supportsNftPositions: boolean;
  supportsSponsoredTransactions: boolean;
  supportsGasPrices: boolean;
  supportsSimulations: boolean;
};

export type ChainFullInfo = {
  id: string;
  /** Display name of the chain */
  name: string;
  /** URL to the chain's icon */
  iconUrl?: null | string;
  /** Whether this chain is a testnet */
  testnet: boolean;
  specification: ChainSpecification;
  /** Block explorer for this chain */
  explorer?: null | ChainExplorer;
  /** Native asset of the chain (e.g. ETH for Ethereum) */
  baseAsset?: null | Fungible;
  flags: ChainFlags;
  /** Zerion-hosted RPC URL for the chain */
  rpcUrl: string;
  /** Public RPC URL for the chain */
  publicRpcUrl: string;
};
