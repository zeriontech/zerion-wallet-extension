import { PersistentStore } from 'src/modules/persistent-store';

export interface State {
  recognizableConnectButtons?: boolean;
}

/**
 * Used to store unencrypted preferences which
 * need to be accessible even before the user logs in
 */
export class GlobalPreferences extends PersistentStore<State> {
  private static defaults: State = {
    recognizableConnectButtons: true,
  };

  getPreferences() {
    const state = this.getState();
    return { ...GlobalPreferences.defaults, ...state };
  }

  setPreferences(preferences: Partial<State>) {
    // Omit values which are the same as the default ones
    const valueWithoutDefaults: Partial<State> = {};
    for (const untypedKey in preferences) {
      const key = untypedKey as keyof typeof preferences;
      if (GlobalPreferences.defaults[key] !== preferences[key]) {
        valueWithoutDefaults[key] = preferences[key];
      }
    }
    this.setState(valueWithoutDefaults);
  }
}
