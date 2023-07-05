import { useQuery } from '@tanstack/react-query';
import { PROXY_URL } from 'src/env/config';
import ky from 'ky';
import type { ConfigPlugin } from '../ConfigPlugin';
import { promises, resolvers } from '../pluginSystem';
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
      retry: 0,
    })
    .json<Pick<RemoteConfig, T>>();
}

let remoteConfig: RemoteConfig | undefined;

export const firebase: ConfigPlugin = {
  onRegister() {
    promises.firebaseRemoteConfig = new Promise<void>((resolve) => {
      resolvers.firebaseRemoteConfig = resolve;
    });
  },

  initialize() {
    fetchRemoteConfig(knownKeys).then((config) => {
      remoteConfig = config;
      resolvers.firebaseRemoteConfig();
    });
  },

  get(key: keyof RemoteConfig) {
    const config = remoteConfig ?? defaultConfig;
    const value = config[key];
    return { value };
  },
};

export function useFirebaseConfig<T extends keyof RemoteConfig>(keys: T[]) {
  return useQuery({
    queryKey: [`fetch firebase config for ${keys}`],
    queryFn: () => fetchRemoteConfig(keys),
    retry: 0,
    refetchOnWindowFocus: false,
  });
}
