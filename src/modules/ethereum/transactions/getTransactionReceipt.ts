import type { TransactionReceipt } from 'ethers';
import { SLOW_MODE } from 'src/env/config';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { wait } from 'src/shared/wait';

export async function getTransactionReceipt({
  hash,
  rpcUrl,
}: {
  hash: string;
  rpcUrl: string;
}) {
  if (SLOW_MODE) {
    await wait(2000);
  }

  const { result } = await sendRpcRequest<TransactionReceipt>(rpcUrl, {
    method: 'eth_getTransactionReceipt',
    params: [hash],
  });
  return result;
}
