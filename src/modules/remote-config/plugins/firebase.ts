import throttle from 'lodash/throttle';
import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { PROXY_URL } from 'src/env/config';
import type { ConfigPlugin } from '../ConfigPlugin';
import { registerPromise, resolvers } from '../pluginSystem';
import type { RemoteConfig } from '../types';

const defaultConfig: RemoteConfig = {
  user_can_create_initial_wallet: false,
  extension_wallet_name_flags: {},
  extension_invitation_campaign_id: '',
};

const knownKeys: (keyof RemoteConfig)[] = [
  'user_can_create_initial_wallet',
  'extension_wallet_name_flags',
  'extension_invitation_campaign_id',
];

async function fetchRemoteConfig<T extends keyof RemoteConfig>(keys: T[]) {
  const params = new URLSearchParams(keys.map((key) => ['key', key]));
  return ky
    .get(new URL(`remote-config?${params.toString()}`, PROXY_URL), {
      timeout: 30000,
      retry: 2,
    })
    .json<Pick<RemoteConfig, T>>();
}

let remoteConfig: RemoteConfig | undefined;

const REFRESH_RATE = 1000 * 60 * 5;

export const firebase: ConfigPlugin & { refresh(): void } = {
  onRegister() {
    const promise = new Promise<void>((resolve) => {
      resolvers.firebaseRemoteConfig = resolve;
    });
    registerPromise('firebaseRemoteConfig', promise);
  },

  initialize() {
    fetchRemoteConfig(knownKeys).then((config) => {
      remoteConfig = config;
      resolvers.firebaseRemoteConfig();
    });
  },

  refresh: throttle(() => firebase.initialize(), REFRESH_RATE, {
    leading: false,
  }),

  get(key: keyof RemoteConfig) {
    /**
     * As a side effect of this getter, we refetch the config value.
     * The refresh() method is designed to be make actual fetch
     * no more than once every {REFRESH_RATE}, so it's ok to call it every time inside this getter
     * By doing this, we make the remoteConfig "eventually up-to-date"
     */
    firebase.refresh();
    const config = remoteConfig ?? defaultConfig;
    const value = config[key];
    return { value };
  },
};

export function useFirebaseConfig<T extends keyof RemoteConfig>(
  keys: T[],
  { suspense = false }: { suspense?: boolean } = {}
) {
  return useQuery({
    // it's okay to put the `keys` array inside queryKey array without memoizing:
    // it will be stringified anyway
    // https://github.com/TanStack/query/blob/b18426da86e2b8990e8f4e7398baaf041f77ad19/packages/query-core/src/utils.ts#L269-L280
    queryKey: ['fetchRemoteConfig', keys],
    queryFn: () => fetchRemoteConfig(keys),
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 20000,
    suspense,
  });
}
