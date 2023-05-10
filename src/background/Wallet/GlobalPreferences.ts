import { PersistentStore } from 'src/modules/persistent-store';

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
}

/**
 * Used to store unencrypted preferences which
 * need to be accessible even before the user logs in
 */
export class GlobalPreferences extends PersistentStore<State> {
  private static defaults: Required<State> = {
    recognizableConnectButtons: true,
    providerInjection: {},
  };

  getPreferences(): Required<State> {
    const state = this.getState();
    return { ...GlobalPreferences.defaults, ...state };
  }

  setPreferences(preferences: Partial<State>) {
    // Omit values which are the same as the default ones
    const valueWithoutDefaults = {
      ...GlobalPreferences.defaults,
      ...preferences,
    };
    for (const untypedKey in valueWithoutDefaults) {
      const key = untypedKey as keyof typeof valueWithoutDefaults;
      if (valueWithoutDefaults[key] === GlobalPreferences.defaults[key]) {
        delete valueWithoutDefaults[key];
      }
    }
    this.setState(valueWithoutDefaults);
  }
}
