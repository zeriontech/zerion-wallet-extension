import type { NetworkConfig } from './NetworkConfig';

export const chainsInfo: NetworkConfig[] = [
  {
    id: 'ethereum',
    chain: 'ethereum',
    evm_id: 1,
    external_id: '0x1',
    name: 'Ethereum',
    node_urls: ['https://cloudflare-eth.com'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://etherscan.io'],
    explorer_token_url: 'https://etherscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://etherscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://etherscan.io/tx/{HASH}',
    explorer_home_url: 'https://etherscan.io',
    explorer_name: 'Etherscan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/ethereum',
    rpc_url_public: ['https://cloudflare-eth.com'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'binance-smart-chain',
    chain: 'binance-smart-chain',
    evm_id: 56,
    external_id: '0x38',
    name: 'BNB Chain',
    node_urls: [
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
    icon_url: 'https://chain-icons.s3.amazonaws.com/bsc.png',
    base_asset_id: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
    block_explorer_urls: ['https://bscscan.com'],
    explorer_token_url: 'https://bscscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://bscscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://bscscan.com/tx/{HASH}',
    explorer_home_url: 'https://bscscan.com',
    explorer_name: 'BscScan',
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
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'arbitrum',
    chain: 'arbitrum',
    evm_id: 42161,
    external_id: '0xa4b1',
    name: 'Arbitrum',
    node_urls: ['https://arb1.arbitrum.io/rpc'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/arbitrum.png',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://arbiscan.io'],
    explorer_token_url: 'https://arbiscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://arbiscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://arbiscan.io/tx/{HASH}',
    explorer_home_url: 'https://arbiscan.io',
    explorer_name: 'Arbiscan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/arbitrum',
    rpc_url_public: ['https://arb1.arbitrum.io/rpc'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'polygon',
    chain: 'polygon',
    evm_id: 137,
    external_id: '0x89',
    name: 'Polygon',
    node_urls: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://matic-mainnet.chainstacklabs.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet-full-rpc.bwarelabs.com',
    ],
    icon_url: 'https://chain-icons.s3.amazonaws.com/polygon.png',
    base_asset_id: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    block_explorer_urls: ['https://polygonscan.com'],
    explorer_token_url: 'https://polygonscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://polygonscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://polygonscan.com/tx/{HASH}',
    explorer_home_url: 'https://polygonscan.com',
    explorer_name: 'PolygonScan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/polygon',
    rpc_url_public: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://matic-mainnet.chainstacklabs.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet-full-rpc.bwarelabs.com',
    ],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'optimism',
    chain: 'optimism',
    evm_id: 10,
    external_id: '0xa',
    name: 'Optimism',
    node_urls: ['https://mainnet.optimism.io'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/optimism.png',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://optimistic.etherscan.io'],
    explorer_token_url: 'https://optimistic.etherscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://optimistic.etherscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://optimistic.etherscan.io/tx/{HASH}',
    explorer_home_url: 'https://optimistic.etherscan.io',
    explorer_name: 'Etherscan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/optimism',
    rpc_url_public: ['https://mainnet.optimism.io'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'avalanche',
    chain: 'avalanche',
    evm_id: 43114,
    external_id: '0xa86a',
    name: 'Avalanche',
    node_urls: ['https://api.avax.network/ext/bc/C/rpc'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/avalanche.png',
    base_asset_id: '43e05303-bf43-48df-be45-352d7567ff39',
    block_explorer_urls: ['https://snowtrace.io'],
    explorer_token_url: 'https://snowtrace.io/token/{ADDRESS}',
    explorer_address_url: 'https://snowtrace.io/address/{ADDRESS}',
    explorer_tx_url: 'https://snowtrace.io/tx/{HASH}',
    explorer_home_url: 'https://snowtrace.io',
    explorer_name: 'SnowTrace',
    rpc_url_internal: 'https://rpc.zerion.io/v1/avalanche',
    rpc_url_public: ['https://api.avax.network/ext/bc/C/rpc'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'base',
    chain: 'base',
    evm_id: 8453,
    external_id: '0x2105',
    name: 'Base',
    node_urls: ['https://mainnet.base.org'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/8453',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://basescan.org'],
    explorer_token_url: 'https://basescan.org/token/{ADDRESS}',
    explorer_address_url: 'https://basescan.org/address/{ADDRESS}',
    explorer_tx_url: 'https://basescan.org/tx/{HASH}',
    explorer_home_url: 'https://basescan.org',
    explorer_name: 'Base Explorer',
    rpc_url_internal: 'https://rpc.zerion.io/v1/base',
    rpc_url_public: ['https://mainnet.base.org'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'celo',
    chain: 'celo',
    evm_id: 42220,
    external_id: '0xa4ec',
    name: 'Celo',
    node_urls: ['https://forno.celo.org', 'wss://forno.celo.org/ws'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/42220',
    base_asset_id: '0x471ece3750da237f93b8e339c536989b8978a438',
    block_explorer_urls: ['https://celoscan.io', 'https://explorer.celo.org'],
    explorer_token_url: 'https://celoscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://celoscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://celoscan.io/tx/{HASH}',
    explorer_home_url: 'https://celoscan.io',
    explorer_name: 'Celoscan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/celo',
    rpc_url_public: ['https://forno.celo.org', 'wss://forno.celo.org/ws'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: false,
    native_asset: {
      id: '0x471ece3750da237f93b8e339c536989b8978a438',
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
      name: 'Celo',
      symbol: 'celo',
      decimals: 18,
    },
    wrapped_native_asset: null,
    is_testnet: false,
  },
  {
    id: 'fantom',
    chain: 'fantom',
    evm_id: 250,
    external_id: '0xfa',
    name: 'Fantom',
    node_urls: ['https://rpc.ftm.tools'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/fantom.png',
    base_asset_id: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
    block_explorer_urls: ['https://ftmscan.com'],
    explorer_token_url: 'https://ftmscan.com/token/{ADDRESS}',
    explorer_address_url: 'https://ftmscan.com/address/{ADDRESS}',
    explorer_tx_url: 'https://ftmscan.com/tx/{HASH}',
    explorer_home_url: 'https://ftmscan.com',
    explorer_name: 'FtmScan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/fantom',
    rpc_url_public: ['https://rpc.ftm.tools'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'xdai',
    chain: 'xdai',
    evm_id: 100,
    external_id: '0x64',
    name: 'Gnosis Chain',
    node_urls: [
      'https://gnosis-mainnet.public.blastapi.io',
      'https://gnosischain-rpc.gateway.pokt.network',
      'https://rpc.ankr.com/gnosis',
      'https://rpc.gnosischain.com',
    ],
    icon_url: 'https://chain-icons.s3.amazonaws.com/xdai.png',
    base_asset_id: 'b99ea659-0ab1-4832-bf44-3bf1cc1acac7',
    block_explorer_urls: ['https://gnosisscan.io'],
    explorer_token_url: 'https://gnosisscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://gnosisscan.io/address/{ADDRESS}',
    explorer_tx_url: 'https://gnosisscan.io/tx/{HASH}',
    explorer_home_url: 'https://gnosisscan.io',
    explorer_name: 'GnosisScan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/xdai',
    rpc_url_public: [
      'https://gnosis-mainnet.public.blastapi.io',
      'https://gnosischain-rpc.gateway.pokt.network',
      'https://rpc.ankr.com/gnosis',
      'https://rpc.gnosischain.com',
    ],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'aurora',
    chain: 'aurora',
    evm_id: 1313161554,
    external_id: '0x4e454152',
    name: 'Aurora',
    node_urls: ['https://mainnet.aurora.dev'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/aurora.png',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://aurorascan.dev'],
    explorer_token_url: 'https://aurorascan.dev/token/{ADDRESS}',
    explorer_address_url: 'https://aurorascan.dev/address/{ADDRESS}',
    explorer_tx_url: 'https://aurorascan.dev/tx/{HASH}',
    explorer_home_url: 'https://aurorascan.dev',
    explorer_name: 'AuroraScan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/aurora',
    rpc_url_public: ['https://mainnet.aurora.dev'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
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
    is_testnet: false,
  },
  {
    id: 'solana',
    chain: 'solana',
    evm_id: null,
    external_id: '0x65',
    name: 'Solana',
    node_urls: ['https://free.rpcpool.com'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/solana.png',
    base_asset_id: '11111111111111111111111111111111',
    block_explorer_urls: ['https://solscan.io', 'https://explorer.solana.com'],
    explorer_token_url: 'https://solscan.io/token/{ADDRESS}',
    explorer_address_url: 'https://solscan.io/account/{ADDRESS}',
    explorer_tx_url: 'https://solscan.io/tx/{HASH}',
    explorer_home_url: 'https://solscan.io',
    explorer_name: 'Solscan',
    rpc_url_internal: 'https://rpc.zerion.io/v1/solana',
    rpc_url_public: ['https://free.rpcpool.com'],
    supports_trading: false,
    supports_sending: false,
    supports_bridge: false,
    native_asset: {
      id: '11111111111111111111111111111111',
      address: '11111111111111111111111111111111',
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    wrapped_native_asset: null,
    is_testnet: false,
  },
  {
    id: 'zksync-era',
    chain: 'zksync-era',
    evm_id: 324,
    external_id: '0x144',
    name: 'zkSync Era',
    node_urls: ['https://mainnet.era.zksync.io'],
    icon_url: 'https://chain-icons.s3.amazonaws.com/chainlist/324',
    base_asset_id: 'eth',
    block_explorer_urls: ['https://explorer.zksync.io'],
    explorer_token_url: 'https://explorer.zksync.io/address/{ADDRESS}',
    explorer_address_url: 'https://explorer.zksync.io/address/{ADDRESS}',
    explorer_tx_url: 'https://explorer.zksync.io/tx/{HASH}',
    explorer_home_url: 'https://explorer.zksync.io',
    explorer_name: 'zkSync Era Block Explorer',
    rpc_url_internal: 'https://rpc.zerion.io/v1/zksync-era',
    rpc_url_public: ['https://mainnet.era.zksync.io'],
    supports_trading: true,
    supports_sending: true,
    supports_bridge: true,
    native_asset: {
      id: 'eth',
      address: null,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    wrapped_native_asset: null,
    is_testnet: false,
  },
];
