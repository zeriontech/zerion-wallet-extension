import { useMemo } from 'react';
import ky from 'ky';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  WalletAbility,
  WalletAbilityType,
} from 'src/shared/types/Daylight';
import { PROXY_URL } from 'src/env/config';

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
  limit,
  link,
}: {
  address?: string;
  params?: FilterParams;
  limit?: number;
  link?: string;
}): Promise<WalletAbilitiesResponse> {
  const { type, ...rest } = params || { type: [] };
  const searchParams = new URLSearchParams([
    ['limit', limit?.toString() || '10'],
    ...(type.map((item) => ['type', item]) || []),
    ...(Object.entries(rest) as [string, string][]),
  ]);
  const firstPageLink = `/v1/wallets/${address}/abilities?${searchParams}`;
  const result = await ky
    .get(new URL(`daylight${link ?? firstPageLink}`, PROXY_URL), {
      timeout: 20000,
    })
    .json<WalletAbilitiesResponse>();
  return result;
}

export function useWalletAbilities({
  address,
  params,
  limit,
  onSuccess,
}: {
  address: string;
  params: FilterParams;
  limit?: number;
  onSuccess?(data: InfiniteData<WalletAbilitiesResponse>): void;
}) {
  const { data, ...result } = useInfiniteQuery(
    `wallet/abilities/${address}/${JSON.stringify(params)}`,
    ({ pageParam = { address, params, limit } }) =>
      getWalletAbilities(pageParam),
    {
      getNextPageParam: (lastPage) =>
        lastPage.links.next ? { link: lastPage.links.next } : undefined,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      suspense: false,
      keepPreviousData: true,
      onSuccess,
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
    .get(new URL(`daylight/v1/abilities/${uid}`, PROXY_URL), { timeout: 20000 })
    .json<{ ability: WalletAbility }>();
  return result;
}

export function getAbilityLinkTitle(ability?: WalletAbility) {
  return ability?.action.linkUrl
    ? new URL(ability?.action.linkUrl).hostname
    : undefined;
}
