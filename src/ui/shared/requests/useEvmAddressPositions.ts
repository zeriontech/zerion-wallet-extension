import { useQuery } from '@tanstack/react-query';
import type { AddressPosition } from 'defi-sdk';
import type { Networks } from 'src/modules/networks/Networks';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { Chain } from 'src/modules/networks/Chain';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_RPC_URL } from 'src/env/config';
import { fetchNativeEvmPosition } from './fetchNativeEvmPosition';

async function getEvmAddressPositions({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: ChainId;
  networks: Networks;
}) {
  const position = await fetchNativeEvmPosition({ address, chainId, networks });
  return [position];
}

async function fetchEvmAddressPositions({
  address,
  chain,
}: {
  address: string | null;
  chain: Chain;
}) {
  const networksStore = await getNetworksStore();
  const networks = await networksStore.load({ chains: [chain.toString()] });
  const chainId = networks.getChainId(chain);
  return !address || !chainId
    ? null
    : getEvmAddressPositions({
        address,
        chainId,
        networks,
      });
}

export function useEvmAddressPositions({
  address,
  chain,
  suspense = false,
  enabled = true,
}: {
  address: string | null;
  chain: Chain;
  suspense?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['eth_getBalance/evmAddressPositions', address, chain],
    queryFn: async () => fetchEvmAddressPositions({ address, chain }),
    suspense,
    enabled: enabled && Boolean(address),
  });
}

async function solanaGetBalance(address: string) {
  const connection = new Connection(SOLANA_RPC_URL);
  return await connection.getBalance(new PublicKey(address));
}

function createSolPosition(balance: number): AddressPosition {
  const decimals = 9;
  return {
    quantity: balance.toFixed(),
    apy: null,
    chain: 'solana',
    dapp: null,
    id: 'sol-asset',
    included_in_chart: false,
    is_displayable: true,
    name: 'Asset',
    parent_id: null,
    type: 'asset',
    value: null,
    protocol: null,
    asset: {
      id: 'solana',
      asset_code: 'SOL',
      decimals,
      icon_url: 'https://token-icons.s3.us-east-1.amazonaws.com/solana.png',
      name: 'Solana',
      price: null,
      symbol: 'SOL',
      type: 'native',
      is_displayable: true,
      is_verified: true,
    },
  };
}

async function fetchSolanaAddressPositions(address: string) {
  const balance = await solanaGetBalance(address);
  const position = createSolPosition(balance);
  return [position];
}

export function useAddressPositionFromNode({
  address,
  chain,
  suspense = false,
  enabled = true,
}: {
  address: string | null;
  chain: Chain;
  suspense?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['fetchAddressPositionsFromNode', address, chain],
    queryFn: async () => {
      if (!address) {
        return null;
      }
      const isSolana = isSolanaAddress(address);
      return isSolana
        ? fetchSolanaAddressPositions(address)
        : fetchEvmAddressPositions({ address, chain });
    },
    enabled,
    suspense,
  });
}
