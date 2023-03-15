import { ethers } from 'ethers';
import ky from 'ky';
import { normalizedContains } from 'normalized-contains';
import { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';

function contains(str1: string, str2: string) {
  return normalizedContains(str1.toLowerCase(), str2.toLowerCase());
}

interface ResponseItem {
  name: string;
  rpc: string[];
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  chainId: number;
  explorers?: [
    {
      name: string;
      url: string;
      standard: string;
    }
  ];
}

export async function getNetworksBySearch({ query }: { query: string }) {
  return ky('http://chainid.network/chains.json')
    .json<ResponseItem[]>()
    .then((result) => {
      return result.map(
        (item): AddEthereumChainParameter => ({
          chainId: ethers.utils.hexValue(item.chainId),
          chainName: item.name,
          nativeCurrency: item.nativeCurrency,
          rpcUrls: item.rpc,
          blockExplorerUrls: item.explorers?.map((e) => e.url),
          iconUrls: [`https://chain-icons.s3.amazonaws.com/${item.icon}.png`],
        })
      );
    })
    .then((items) => {
      return items
        .filter(
          (item) =>
            contains(item.chainName, query) ||
            contains(item.nativeCurrency.name, query) ||
            contains(item.nativeCurrency.symbol, query) ||
            contains(item.rpcUrls.join(' '), query) ||
            contains(item.blockExplorerUrls?.join(' ') || '', query) ||
            contains(item.chainId, query) ||
            contains(String(parseInt(item.chainId)), query)
        )
        .slice(0, 20);
    });
}
