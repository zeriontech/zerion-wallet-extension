import { Store } from 'store-unit';
import { retrieve } from './persistence';

export enum ThemePreference {
  system,
  light,
  dark,
}

export interface State {
  mode: ThemePreference;
  currency: string;
}

const initialState = { mode: ThemePreference.system, currency: 'usd' };

export const preferenceStore = new Store<State>({
  ...initialState,
  ...retrieve(),
});
