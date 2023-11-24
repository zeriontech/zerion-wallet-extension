import { ethers } from 'ethers';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import memoize from 'lodash/memoize';

const getRpcProvider = memoize(
  (url) => new ethers.providers.JsonRpcProvider(url)
);

const lookup = memoize((address, url) => {
  const provider = getRpcProvider(url);
  return provider.lookupAddress(address);
});

export async function ensLookup(address: string): Promise<string | null> {
  const networks = await networksStore.load();
  const nodeUrl = networks.getRpcUrlInternal(
    networks.getChainById(ChainId.Mainnet)
  );
  return lookup(address, nodeUrl);
}

function ensMatch(maybeDomain: string) {
  return /[^/?]+\.eth$/i.test(maybeDomain);
}

export async function ensResolve(domain: string): Promise<string | null> {
  if (!ensMatch(domain)) {
    return null;
  }
  const networks = await networksStore.load();
  const nodeUrl = networks.getRpcUrlInternal(
    networks.getChainById(ChainId.Mainnet)
  );
  const provider = getRpcProvider(nodeUrl);
  return provider.resolveName(domain);
}
