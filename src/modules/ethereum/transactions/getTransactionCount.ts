import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';

export async function getTransactionCount(
  address: string,
  chain: Chain,
  networks: Networks
) {
  const url = networks.getRpcUrlInternal(chain);

  const { result } = await sendRpcRequest<string>(url, {
    method: 'eth_getTransactionCount',
    params: [address, 'latest'],
  });
  return { value: result, source: new URL(url).origin };
}
