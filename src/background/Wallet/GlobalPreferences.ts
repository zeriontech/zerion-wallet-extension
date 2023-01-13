import { Store } from 'store-unit';
import * as browserStorage from 'src/background/webapis/storage';

export interface State {
  recognizableConnectButtons?: boolean;
}

/**
 * Used to store unencrypted preferences which
 * need to be accessible even before the user logs in
 */
export class GlobalPreferences extends Store<State> {
  private key: string;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  private static defaults: State = {
    recognizableConnectButtons: true,
  };

  constructor(initialState: State, key = 'globalPreferences') {
    super(initialState);
    this.key = key;
    this.isReady = false;
    this.readyPromise = this.restore();
    this.on('change', (state) => {
      browserStorage.set(this.key, state);
    });
  }

  async restore() {
    const saved = await browserStorage.get<State>(this.key);
    if (saved) {
      this.setState(saved);
    }
    this.isReady = true;
  }

  async ready(): Promise<void> {
    return this.isReady ? Promise.resolve() : this.readyPromise;
  }

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
