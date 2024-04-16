import { ethers } from 'ethers';
import type { Networks } from 'src/modules/networks/Networks';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { httpConnectionPort } from '../channels';
import { createAddressPosition } from './shared/createAddressPosition';

export async function fetchNativeEvmPosition({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: ChainId;
  networks: Networks;
}) {
  const balanceInHex = await httpConnectionPort.request('eth_getBalance', {
    params: [address, 'latest'],
    context: { chainId },
  });
  const network = networks.getNetworkById(chainId);
  const balance = ethers.BigNumber.from(balanceInHex).toString();
  return createAddressPosition({ balance, network });
}
