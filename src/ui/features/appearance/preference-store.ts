import { Store } from 'store-unit';
import { retrieve } from './persistence';

export enum Preference {
  system,
  light,
  dark,
}

export interface State {
  mode: Preference;
}

export const preferenceStore = new Store<State>({
  mode: Preference.system,
});

retrieve().then((value) => {
  if (value && value.mode !== preferenceStore.getState().mode) {
    preferenceStore.setState(value);
  }
});
