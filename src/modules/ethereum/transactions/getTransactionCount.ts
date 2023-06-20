import { SLOW_MODE } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { wait } from 'src/shared/wait';

export async function getTransactionCount(
  address: string,
  chain: Chain,
  networks: Networks
) {
  const url = networks.getRpcUrlInternal(chain);

  if (SLOW_MODE) {
    await wait(2000);
  }

  const { result } = await sendRpcRequest<string>(url, {
    method: 'eth_getTransactionCount',
    params: [address, 'latest'],
  });
  return { value: result, source: new URL(url).origin };
}
