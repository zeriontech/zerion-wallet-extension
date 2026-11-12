import type { Wallet } from './Wallet';

type PublicController = Wallet['publicEthereumController'];

/**
 * The only wallet methods a web page can invoke. A page's request for any
 * other method is forwarded to the network's RPC node.
 *
 * A new dapp RPC method must be added here, or pages cannot reach it.
 * Helpers of PublicController must NOT be added here.
 */
export const DAPP_RPC_METHODS = [
  'eth_accounts',
  'eth_requestAccounts',
  'eth_chainId',
  'net_version',
  'eth_sendTransaction',
  'eth_signTypedData_v4',
  'eth_signTypedData',
  'eth_sign',
  'personal_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_requestPermissions',
  'wallet_getPermissions',
  'wallet_getWalletNameFlags',
  'wallet_registerEip6963Support',
  'wallet_getGlobalPreferences',
  'wallet_isKnownDapp',
  'sol_connect',
  'sol_disconnect',
  'sol_signTransaction',
  'sol_signAndSendTransaction',
  'sol_signAllTransactions',
  'sol_signMessage',
] as const satisfies ReadonlyArray<keyof PublicController>;

export type DappRpcMethod = (typeof DAPP_RPC_METHODS)[number];

const dappRpcMethods: ReadonlySet<string> = new Set(DAPP_RPC_METHODS);

export function isDappRpcMethod(method: unknown): method is DappRpcMethod {
  return typeof method === 'string' && dappRpcMethods.has(method);
}
