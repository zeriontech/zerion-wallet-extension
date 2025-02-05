import type { TransactionReceipt } from 'ethers';
import { SLOW_MODE } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { wait } from 'src/shared/wait';

export async function getTransactionReceipt({
  hash,
  chain,
  networks,
}: {
  hash: string;
  chain: Chain;
  networks: Networks;
}) {
  if (SLOW_MODE) {
    await wait(2000);
  }

  const url = networks?.getRpcUrlInternal(chain);

  const { result } = await sendRpcRequest<TransactionReceipt>(url, {
    method: 'eth_getTransactionReceipt',
    params: [hash],
  });
  return result;
}
