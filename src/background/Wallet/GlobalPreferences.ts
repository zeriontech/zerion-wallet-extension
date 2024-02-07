import throttle from 'lodash/throttle';
import { PersistentStore } from 'src/modules/persistent-store';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import { removeEmptyValues } from 'src/shared/removeEmptyValues';
import { equal } from 'src/modules/fast-deep-equal';
import type { WalletNameFlag } from './model/WalletNameFlag';

const HALF_DAY = 1000 * 60 * 60 * 12;

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
  autoLockTimeout?: number | 'none';
}

/**
 * Used to store unencrypted preferences which
 * need to be accessible even before the user logs in
 */
export class GlobalPreferences extends PersistentStore<State> {
  /** 5 minutes */
  private REFRESH_RATE = 1000 * 60 * 5;

  private defaults: Required<State> = {
    recognizableConnectButtons: true,
    providerInjection: {},
    walletNameFlags: {},
    autoLockTimeout: HALF_DAY,
  };

  private async fetchDefaultWalletNameFlags() {
    const config = getRemoteConfigValue(
      'extension_wallet_name_flags'
    ) as RemoteConfig['extension_wallet_name_flags'];
    if (config) {
      this.defaults.walletNameFlags = config;
    }
  }

  async initialize() {
    await this.ready();
    this.fetchDefaultWalletNameFlags();
  }

  refresh = throttle(() => this.initialize(), this.REFRESH_RATE, {
    leading: false,
  });

  async getPreferences(): Promise<Required<State>> {
    /**
     * As a side effect of anyone querying preferences, we refetch defaults that
     * are queried externally. The refresh() method is designed to be make actual fetch
     * no more than once every {this.REFRESH_RATE}, so it's ok to call it every time inside this getter
     * By doing this, we make the defaults "eventually up-to-date"
     */
    this.refresh();
    const state = removeEmptyValues(await this.getSavedState());
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
      // we need to remove all empty walletNameFlags configs if they don't override default settings
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

export const globalPreferences = new GlobalPreferences({}, 'globalPreferences');
