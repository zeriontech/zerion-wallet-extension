import { useMemo } from 'react';
import ky from 'ky';
import { useInfiniteQuery } from 'react-query';

export type WalletAbilityType =
  | 'vote'
  | 'claim'
  | 'airdrop'
  | 'mint'
  | 'article'
  | 'access'
  | 'result'
  | 'event'
  | 'product'
  | 'misc';

interface WalletAbilitySupplier {
  id: number;
  name: string;
  slug: string;
  url: string;
}

type CommunityType = 'ERC-20' | 'ERC-721' | 'ERC-1155';

interface WalletAbilityTokenRequirement {
  chain: 'ethereum';
  type: 'hasTokenBalance';
  address: string;
  minAmount: number;
  community: {
    title: string;
    contractAddress: string;
    type: CommunityType;
    chain: 'ethereum';
    imageUrl: string;
    linkUrl: string;
    description: string;
    currencyCode: string;
    slug: string;
  };
}

interface WalletAbilityNFTRequirement {
  chain: 'ethereum';
  type: 'hasNftWithSpecificId';
  address: string;
  id: string[];
  community: {
    title: string;
    contractAddress: string;
    type: CommunityType;
    chain: 'ethereum';
    imageUrl: string;
    linkUrl: string;
    description: string;
    currencyCode: string;
    slug: string;
  };
}

interface WalletAbilityAllowlistTokenRequirement {
  chain: 'ethereum';
  type: 'onAllowlist';
  addresses: string[];
}

type WalletAbilityRequirement =
  | WalletAbilityTokenRequirement
  | WalletAbilityNFTRequirement
  | WalletAbilityAllowlistTokenRequirement;

export interface WalletAbility {
  type: WalletAbilityType;
  title: string;
  description: string;
  imageUrl: string;
  openAt: string;
  closeAt: string;
  isClosed: boolean;
  createdAt: string;
  slug: string;
  sourceId: string;
  chain: 'ethereum';
  uid: string;
  supplier: WalletAbilitySupplier;
  action: {
    linkUrl: string;
    // in the future here will be more info for completing the ability
  };
  requirements: WalletAbilityRequirement[];
  submitter: {
    publicKey: string;
    chain: 'ethereum';
  };
  walletMetadata: object;
  walletCompleted: boolean;
}

interface WalletAbilitiesResponse {
  abilities: WalletAbility[];
  status: 'synced' | 'pending';
  links: {
    previous: string;
    next: string;
  };
}

export interface StatusFilterParams {
  deadline: 'all' | 'expired';
  showCompleted: boolean;
}

interface FilterParams extends Partial<StatusFilterParams> {
  type: WalletAbilityType[];
}

async function getWalletAbilities({
  address,
  params,
  link,
}: {
  address: string;
  params?: FilterParams;
  link: string;
}): Promise<WalletAbilitiesResponse> {
  const { type, ...rest } = params || { type: [] };
  const searchParams = new URLSearchParams([
    ['limit', '10'],
    ['sort', 'magic'],
    ...(type.map((item) => ['type', item]) || []),
    ...(Object.entries(rest) as [string, string][]),
  ]);
  const firstPageLink = `/v1/wallets/${address}/abilities?${searchParams}`;
  const result = await ky
    .get(`https://api.daylight.xyz${link ?? firstPageLink}`)
    .json<WalletAbilitiesResponse>();
  return result;
}

export function useWalletAbilities({
  address,
  params,
}: {
  address: string;
  params: FilterParams;
}) {
  const { data, ...result } = useInfiniteQuery(
    `wallet/abilities/${address}/${JSON.stringify(params)}`,
    ({ pageParam = { address, params } }) => getWalletAbilities(pageParam),
    {
      getNextPageParam: (lastPage) => ({ link: lastPage.links.next, address }),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      suspense: false,
      keepPreviousData: true,
    }
  );

  const value = useMemo(() => {
    return data
      ? ([] as WalletAbility[]).concat(
          ...data.pages.map((page) => page.abilities)
        )
      : ([] as WalletAbility[]);
  }, [data]);

  return { value, ...result };
}

export async function getAbility(uid: string) {
  const result = await ky
    .get(`https://api.daylight.xyz/v1/abilities/${uid}`)
    .json<{ ability: WalletAbility }>();
  return result;
}

export function getAbilityLinkTitle(ability?: WalletAbility) {
  return ability?.action.linkUrl?.split('/')[2];
}
