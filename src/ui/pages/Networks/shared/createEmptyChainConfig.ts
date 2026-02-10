import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';

export const createEmptyChainConfig = (): AddEthereumChainParameter => ({
  chainId: '',
  chainName: '',
  nativeCurrency: {
    decimals: 18,
    name: '',
    symbol: '',
  },
  rpcUrls: [''],
  is_testnet: undefined,
});
