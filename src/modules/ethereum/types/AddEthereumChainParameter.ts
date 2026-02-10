export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    // code: string | null;
    name: string;
    symbol: string; // 2-6 characters long
    decimals: number; // 18
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
  hidden?: boolean; // Not in standart, but this is a part of Network Form
  is_testnet?: boolean; // User-defined testnet status for custom networks
}
