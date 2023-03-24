import { ethers } from 'ethers';
import ky from 'ky';
import { toNetworkConfig } from 'src/modules/networks/helpers';
import { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { filterNetworksByQuery } from './filterNetworkByQuery';

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
    .then((items) => items.map((item) => toNetworkConfig(item)))
    .then((items) => {
      return items.filter(filterNetworksByQuery(query)).slice(0, 20);
    });
}
