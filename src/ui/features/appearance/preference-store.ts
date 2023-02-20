import { Store } from 'store-unit';
import { retrieve } from './persistence';

export enum ThemePreference {
  system,
  light,
  dark,
}

export interface State {
  mode: ThemePreference;
}

const initialState = retrieve() || { mode: ThemePreference.system };

export const preferenceStore = new Store<State>(initialState);
