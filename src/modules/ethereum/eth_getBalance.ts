import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';

export async function eth_getBalance(
  url: string,
  address: string
): Promise<string> {
  const { result: balanceInHex } = await sendRpcRequest<string>(url, {
    method: 'eth_getBalance',
    params: [address, 'latest'],
  });
  const balance = BigInt(balanceInHex).toString();
  return balance;
}
