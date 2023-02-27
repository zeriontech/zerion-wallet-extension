import { ethers } from 'ethers';
import { networksStore } from 'src/modules/networks/networks-store';
import { ChainId } from 'src/modules/ethereum/transactions/ChainId';

export async function ensLookup(address: string): Promise<string | null> {
  const networks = await networksStore.load();
  const nodeUrl = networks.getRpcUrlInternal(
    networks.getChainById(ChainId.Mainnet)
  );
  const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
  return provider.lookupAddress(address);
}

export async function ensResolve(domain: string): Promise<string | null> {
  const networks = await networksStore.load();
  const nodeUrl = networks.getRpcUrlInternal(
    networks.getChainById(ChainId.Mainnet)
  );
  const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
  return provider.resolveName(domain);
}
