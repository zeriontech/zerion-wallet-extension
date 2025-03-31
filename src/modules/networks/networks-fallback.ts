import type { NetworkConfig } from './NetworkConfig';

export const networksFallbackInfo: NetworkConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon_url: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 1,
        eip1559: true,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/ethereum',
    rpc_url_public: ['https://cloudflare-eth.com'],
    explorer_name: 'Etherscan',
    explorer_token_url: 'https://etherscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://etherscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://etherscan.io/tx/{HASH}',
    explorer_home_url: 'https://etherscan.io',
    explorer_urls: ['https://etherscan.io'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'binance-smart-chain',
    name: 'BNB Chain',
    icon_url: 'https://chain-icons.s3.amazonaws.com/bsc.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 56,
        eip1559: false,
      },
    },
    native_asset: {
      id: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
      address: null,
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/binance-smart-chain',
    rpc_url_public: [
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed2.defibit.io',
      'https://bsc-dataseed3.defibit.io',
      'https://bsc-dataseed4.defibit.io',
      'https://bsc-dataseed1.ninicoin.io',
      'https://bsc-dataseed2.ninicoin.io',
      'https://bsc-dataseed3.ninicoin.io',
      'https://bsc-dataseed4.ninicoin.io',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org',
    ],
    explorer_name: 'BscScan',
    explorer_token_url: 'https://bscscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://bscscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://bscscan.com/tx/{HASH}',
    explorer_home_url: 'https://bscscan.com',
    explorer_urls: ['https://bscscan.com'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    icon_url: 'https://chain-icons.s3.amazonaws.com/arbitrum.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 42161,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/arbitrum',
    rpc_url_public: ['https://arb1.arbitrum.io/rpc'],
    explorer_name: 'Arbiscan',
    explorer_token_url: 'https://arbiscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://arbiscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://arbiscan.io/tx/{HASH}',
    explorer_home_url: 'https://arbiscan.io',
    explorer_urls: ['https://arbiscan.io'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'blast',
    name: 'Blast',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/81457',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 81457,
        eip1559: true,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x4300000000000000000000000000000000000004',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/blast',
    rpc_url_public: [],
    explorer_name: 'Blastscan',
    explorer_token_url: 'https://blastscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://blastscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://blastscan.io/tx/{HASH}',
    explorer_home_url: 'https://blastscan.io',
    explorer_urls: ['https://blastscan.io'],
    supports_sending: true,
    supports_trading: false,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    icon_url: 'https://chain-icons.s3.amazonaws.com/avalanche.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 43114,
        eip1559: true,
      },
    },
    native_asset: {
      id: '43e05303-bf43-48df-be45-352d7567ff39',
      address: null,
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      name: 'Wrapped AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/avalanche',
    rpc_url_public: ['https://api.avax.network/ext/bc/C/rpc'],
    explorer_name: 'SnowTrace',
    explorer_token_url: 'https://snowtrace.io/token/{ADDRESS}',
    explorer_address_url: 'https://snowtrace.io/address/{ADDRESS}',
    explorer_tx_url: 'https://snowtrace.io/tx/{HASH}',
    explorer_home_url: 'https://snowtrace.io',
    explorer_urls: ['https://snowtrace.io'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    icon_url: 'https://chain-icons.s3.amazonaws.com/polygon.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 137,
        eip1559: true,
      },
    },
    native_asset: {
      id: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      address: '0x0000000000000000000000000000000000001010',
      name: 'Matic Token',
      symbol: 'MATIC',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: 'ef4dfcc9-4a7e-4a92-a538-df3d6f53e517',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      name: 'Wrapped Matic',
      symbol: 'WMATIC',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/polygon',
    rpc_url_public: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://matic-mainnet.chainstacklabs.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet-full-rpc.bwarelabs.com',
    ],
    explorer_name: 'PolygonScan',
    explorer_token_url: 'https://polygonscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://polygonscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://polygonscan.com/tx/{HASH}',
    explorer_home_url: 'https://polygonscan.com',
    explorer_urls: ['https://polygonscan.com'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'optimism',
    name: 'Optimism',
    icon_url: 'https://chain-icons.s3.amazonaws.com/optimism.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 10,
        eip1559: true,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/optimism',
    rpc_url_public: ['https://mainnet.optimism.io'],
    explorer_name: 'Etherscan',
    explorer_token_url: 'https://optimistic.etherscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://optimistic.etherscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://optimistic.etherscan.io/tx/{HASH}',
    explorer_home_url: 'https://optimistic.etherscan.io',
    explorer_urls: ['https://optimistic.etherscan.io'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'base',
    name: 'Base',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/8453',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 8453,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/base',
    rpc_url_public: ['https://mainnet.base.org'],
    explorer_name: 'Base Explorer',
    explorer_token_url: 'https://basescan.org/token/{ADDRESS}',
    explorer_address_url: 'https://basescan.org/address/{ADDRESS}',
    explorer_tx_url: 'https://basescan.org/tx/{HASH}',
    explorer_home_url: 'https://basescan.org',
    explorer_urls: ['https://basescan.org'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'xdai',
    name: 'Gnosis Chain',
    icon_url: 'https://chain-icons.s3.amazonaws.com/xdai.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 100,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'b99ea659-0ab1-4832-bf44-3bf1cc1acac7',
      address: null,
      name: 'xDAI',
      symbol: 'XDAI',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
      address: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
      name: 'Wrapped xDAI',
      symbol: 'wxDAI',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/xdai',
    rpc_url_public: [
      'https://gnosis-mainnet.public.blastapi.io',
      'https://gnosischain-rpc.gateway.pokt.network',
      'https://rpc.ankr.com/gnosis',
      'https://rpc.gnosischain.com',
    ],
    explorer_name: 'GnosisScan',
    explorer_token_url: 'https://gnosisscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://gnosisscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://gnosisscan.io/tx/{HASH}',
    explorer_home_url: 'https://gnosisscan.io',
    explorer_urls: ['https://gnosisscan.io'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'celo',
    name: 'Celo',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/42220',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 42220,
        eip1559: false,
      },
    },
    native_asset: {
      id: '0x471ece3750da237f93b8e339c536989b8978a438',
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
      name: 'Celo',
      symbol: 'celo',
      decimals: 18,
    },
    wrapped_native_asset: null,
    rpc_url_internal: 'https://rpc.zerion.io/v1/celo',
    rpc_url_public: ['https://forno.celo.org', 'wss://forno.celo.org/ws'],
    explorer_name: 'Celoscan',
    explorer_token_url: 'https://celoscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://celoscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://celoscan.io/tx/{HASH}',
    explorer_home_url: 'https://celoscan.io',
    explorer_urls: ['https://celoscan.io', 'https://explorer.celo.org'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: false,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'fantom',
    name: 'Fantom',
    icon_url: 'https://chain-icons.s3.amazonaws.com/fantom.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 250,
        eip1559: false,
      },
    },
    native_asset: {
      id: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
      address: null,
      name: 'Fantom Token',
      symbol: 'FTM',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      name: 'Wrapped Fantom',
      symbol: 'WFTM',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/fantom',
    rpc_url_public: ['https://rpc.ftm.tools'],
    explorer_name: 'FtmScan',
    explorer_token_url: 'https://ftmscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://ftmscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://ftmscan.com/tx/{HASH}',
    explorer_home_url: 'https://ftmscan.com',
    explorer_urls: ['https://ftmscan.com'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: false,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'linea',
    name: 'Linea',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/59144',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 59144,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
      address: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
      name: 'Wrapped Ether (Linea)',
      symbol: 'weth',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/linea',
    rpc_url_public: ['https://rpc.linea.build', 'wss://rpc.linea.build'],
    explorer_name: 'Etherscan',
    explorer_token_url: 'https://lineascan.build/token/{ADDRESS}',
    explorer_address_url: 'https://lineascan.build/address/{ADDRESS}',
    explorer_tx_url: 'https://lineascan.build/tx/{HASH}',
    explorer_home_url: 'https://lineascan.build',
    explorer_urls: ['https://lineascan.build', 'https://explorer.linea.build'],
    supports_sending: true,
    supports_trading: false,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: false,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    icon_url: 'https://chain-icons.s3.amazonaws.com/aurora.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 1313161554,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/aurora',
    rpc_url_public: ['https://mainnet.aurora.dev'],
    explorer_name: 'AuroraScan',
    explorer_token_url: 'https://aurorascan.dev/token/{ADDRESS}',
    explorer_address_url: 'https://aurorascan.dev/address/{ADDRESS}',
    explorer_tx_url: 'https://aurorascan.dev/tx/{HASH}',
    explorer_home_url: 'https://aurorascan.dev',
    explorer_urls: ['https://aurorascan.dev'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: false,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'polygon-zkevm',
    name: 'Polygon zkEVM',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/1101',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 1101,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x4f9a0e7fd2bf6067db6994cf12e4495df938e6e9',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/polygon-zkevm',
    rpc_url_public: ['https://zkevm-rpc.com'],
    explorer_name: 'blockscout',
    explorer_token_url: 'https://zkevm.polygonscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://zkevm.polygonscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://zkevm.polygonscan.com/tx/{HASH}',
    explorer_home_url: 'https://zkevm.polygonscan.com',
    explorer_urls: ['https://zkevm.polygonscan.com'],
    supports_sending: true,
    supports_trading: false,
    supports_bridging: false,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: false,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'scroll',
    name: 'Scroll',
    icon_url: 'https://chain-icons.s3.amazonaws.com/scroll.png',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 534352,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '11bbeef3-6dca-4413-8728-c2027a6587ff',
      address: '0x5300000000000000000000000000000000000004',
      name: 'Bridged Wrapped Ether (Scroll)',
      symbol: 'weth',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/scroll',
    rpc_url_public: [
      'https://rpc.scroll.io',
      'https://rpc-scroll.icecreamswap.com',
      'https://rpc.ankr.com/scroll',
      'https://scroll-mainnet.chainstacklabs.com',
    ],
    explorer_name: 'Scrollscan',
    explorer_token_url: 'https://scrollscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://scrollscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://scrollscan.com/tx/{HASH}',
    explorer_home_url: 'https://scrollscan.com',
    explorer_urls: ['https://scrollscan.com', 'https://blockscout.scroll.io'],
    supports_sending: true,
    supports_trading: false,
    supports_bridging: false,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'zora',
    name: 'Zora',
    icon_url: 'https://chain-icons.s3.amazonaws.com/zora',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 7777777,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/zora',
    rpc_url_public: ['https://rpc.zora.energy/'],
    explorer_name: 'Zora Network Explorer',
    explorer_token_url: 'https://explorer.zora.energy/token/{ADDRESS}',
    explorer_address_url: 'https://explorer.zora.energy/address/{ADDRESS}',
    explorer_tx_url: 'https://explorer.zora.energy/tx/{HASH}',
    explorer_home_url: 'https://explorer.zora.energy',
    explorer_urls: ['https://explorer.zora.energy'],
    supports_sending: true,
    supports_trading: false,
    supports_bridging: false,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
  {
    id: 'zksync-era',
    name: 'zkSync Era',
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/324',
    is_testnet: false,
    standard: 'eip155',
    specification: {
      eip155: {
        id: 324,
        eip1559: false,
      },
    },
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      address: '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
    },
    rpc_url_internal: 'https://rpc.zerion.io/v1/zksync-era',
    rpc_url_public: ['https://mainnet.era.zksync.io'],
    explorer_name: 'zkSync Era Block Explorer',
    explorer_token_url: 'https://era.zksync.network/address/{ADDRESS}',
    explorer_address_url: 'https://era.zksync.network/address/{ADDRESS}',
    explorer_tx_url: 'https://era.zksync.network/tx/{HASH}',
    explorer_home_url: 'https://era.zksync.network',
    explorer_urls: ['https://era.zksync.network'],
    supports_sending: true,
    supports_trading: true,
    supports_bridging: true,
    supports_actions: true,
    supports_positions: true,
    supports_nft_positions: true,
    supports_sponsored_transactions: false,
    supports_simulations: true,
  },
];
