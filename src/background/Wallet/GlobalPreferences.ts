import produce from 'immer';
import { PersistentStore } from 'src/modules/persistent-store';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import type { WalletNameFlag } from './model/WalletNameFlag';

interface Expiration {
  /**
   * timestamp after which the value is considered expired
   * `null` means never expire
   */
  expires: null | number;
}

interface ProviderInjection {
  '<all_urls>'?: Expiration;
  [key: string]: Expiration | undefined;
}

export interface State {
  recognizableConnectButtons?: boolean;
  providerInjection?: ProviderInjection;
  walletNameFlags?: Record<string, WalletNameFlag[]>;
}

/**
 * Used to store unencrypted preferences which
 * need to be accessible even before the user logs in
 */
export class GlobalPreferences extends PersistentStore<State> {
  private static defaults: Required<State> = {
    recognizableConnectButtons: true,
    providerInjection: {},
    walletNameFlags: {},
  };

  private async fetchDefaultWalletNameFlags() {
    const config = (await getRemoteConfigValue(
      'extention_wallet_name_flags'
    )) as RemoteConfig['extention_wallet_name_flags'];
    this.setState((state) =>
      produce(state, (draft) => {
        if (!draft.walletNameFlags) {
          draft.walletNameFlags = {};
        }
        Object.entries(config).forEach(([origin, flags]) => {
          if (draft.walletNameFlags && !draft.walletNameFlags?.[origin]) {
            draft.walletNameFlags[origin] = flags;
          }
        });
      })
    );
  }

  async initialize() {
    await this.ready();
    this.fetchDefaultWalletNameFlags();
  }

  getPreferences(): Required<State> {
    const state = this.getState();
    return { ...GlobalPreferences.defaults, ...state };
  }

  setPreferences(preferences: Partial<State>) {
    // Omit values which are the same as the default ones
    this.setState((state) => {
      const valueWithoutDefaults = {
        ...GlobalPreferences.defaults,
        ...state,
        ...preferences,
      };
      for (const untypedKey in valueWithoutDefaults) {
        const key = untypedKey as keyof typeof valueWithoutDefaults;
        if (valueWithoutDefaults[key] === GlobalPreferences.defaults[key]) {
          delete valueWithoutDefaults[key];
        }
      }
      return valueWithoutDefaults;
    });
  }
}
