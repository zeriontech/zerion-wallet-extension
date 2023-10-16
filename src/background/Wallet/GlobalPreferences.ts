import { PersistentStore } from 'src/modules/persistent-store';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import { removeEmptyValues } from 'src/shared/removeEmptyValues';
import { equal } from 'src/modules/fast-deep-equal';
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
  private defaults: Required<State> = {
    recognizableConnectButtons: true,
    providerInjection: {},
    walletNameFlags: {},
  };

  private async fetchDefaultWalletNameFlags() {
    const config = (await getRemoteConfigValue(
      'extension_wallet_name_flags'
    )) as RemoteConfig['extension_wallet_name_flags'];
    if (config) {
      this.defaults.walletNameFlags = config;
    }
  }

  async initialize() {
    await this.ready();
    this.fetchDefaultWalletNameFlags();
  }

  getPreferences(): Required<State> {
    const state = removeEmptyValues(this.getState());
    return {
      ...this.defaults,
      ...state,
      walletNameFlags: {
        ...this.defaults.walletNameFlags,
        ...state.walletNameFlags,
      },
    };
  }

  setPreferences(preferences: Partial<State>) {
    this.setState((state) => {
      // Omit values which are the same as the default ones
      const valueWithoutDefaults = {
        ...this.defaults,
        ...state,
        ...preferences,
        walletNameFlags: {
          ...this.defaults.walletNameFlags,
          ...state.walletNameFlags,
          ...preferences.walletNameFlags,
        },
      };
      for (const untypedKey in valueWithoutDefaults) {
        const key = untypedKey as keyof typeof valueWithoutDefaults;
        if (equal(valueWithoutDefaults[key], this.defaults[key])) {
          delete valueWithoutDefaults[key];
        }
      }
      // we need to remove all empty walletNageFlags configs if they don't override default settings
      for (const origin in valueWithoutDefaults.walletNameFlags) {
        if (
          (!valueWithoutDefaults.walletNameFlags[origin].length &&
            !(origin in this.defaults.walletNameFlags)) ||
          equal(
            valueWithoutDefaults.walletNameFlags[origin],
            this.defaults.walletNameFlags[origin]
          )
        ) {
          delete valueWithoutDefaults.walletNameFlags[origin];
        }
      }
      return valueWithoutDefaults;
    });
  }
}
