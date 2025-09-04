import throttle from 'lodash/throttle';
import { PersistentStore } from 'src/modules/persistent-store';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import { removeEmptyValues } from 'src/shared/removeEmptyValues';
import { equal } from 'src/modules/fast-deep-equal';
import { difference } from 'src/shared/difference';
// import { PLATFORM } from 'src/env/config';
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
  autoLockTimeout?: number | 'none';
  analyticsEnabled?: boolean | null;
  walletNameFlags?: Record<string, WalletNameFlag[] | undefined>;
}

export function getWalletNameFlagsChange(state: State, prevState: State) {
  const currentKeys = Object.keys(state.walletNameFlags || {});
  const prevKeys = Object.keys(prevState.walletNameFlags || {});

  const newlyEnabled = difference(currentKeys, prevKeys);
  const newlyDisabled = difference(prevKeys, currentKeys);
  return { enabled: newlyEnabled, disabled: newlyDisabled };
}

export function getProviderInjectionChange(state: State, prevState: State) {
  const currentKeys = Object.keys(state.providerInjection || {});
  const prevKeys = Object.keys(prevState.providerInjection || {});
  const newlyPaused = difference(currentKeys, prevKeys);
  const newlyUnpaused = difference(prevKeys, currentKeys);
  return { paused: newlyPaused, unpaused: newlyUnpaused };
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
    analyticsEnabled: null,
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
      // We don't want to persist default values in storage,
      // so here we omit values which are the same as the default ones
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
          // Next two lines are commented out because we changed
          // the default value. Empty arrays must kept as a user-set "off" value.
          // (!valueWithoutDefaults.walletNameFlags[origin]?.length &&
          //   !(origin in this.defaults.walletNameFlags)) ||
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
