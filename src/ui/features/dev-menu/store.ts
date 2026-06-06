import { Store } from 'store-unit';
import {
  DEFAULT_DEV_MENU_STATE,
  type DevMenuState,
  type PriceImpactOverride,
  type ReadonlyWallOverride,
  type SimulationOutputDiscrepancy,
  type SimulationStatusOverride,
  type SimulationWarningOverride,
  type USDisclaimerOverride,
} from './store-types';
import { retrieve, save } from './persistence';

const restored = retrieve();
const initialState: DevMenuState = {
  ...DEFAULT_DEV_MENU_STATE,
  ...(restored ?? {}),
};

export const devMenuStore = new Store<DevMenuState>(initialState);

devMenuStore.on('change', (state) => {
  save(state);
});

export function setPriceImpactOverride(value: PriceImpactOverride) {
  devMenuStore.setState((state) => ({ ...state, priceImpactOverride: value }));
}

export function setSimulationWarningOverride(value: SimulationWarningOverride) {
  devMenuStore.setState((state) => ({
    ...state,
    simulationWarningOverride: value,
  }));
}

export function setSimulationStatusOverride(value: SimulationStatusOverride) {
  devMenuStore.setState((state) => ({
    ...state,
    simulationStatusOverride: value,
  }));
}

export function setSimulationOutputDiscrepancy(
  value: SimulationOutputDiscrepancy
) {
  devMenuStore.setState((state) => ({
    ...state,
    simulationOutputDiscrepancy: value,
  }));
}

export function setUSDisclaimerOverride(value: USDisclaimerOverride) {
  devMenuStore.setState((state) => ({
    ...state,
    usDisclaimerOverride: value,
  }));
}

export function setReadonlyWallOverride(value: ReadonlyWallOverride) {
  devMenuStore.setState((state) => ({
    ...state,
    readonlyWallOverride: value,
  }));
}

export function hasAnyOverride(state: DevMenuState): boolean {
  return (
    state.priceImpactOverride !== 'off' ||
    state.simulationWarningOverride !== 'off' ||
    state.simulationStatusOverride !== 'off' ||
    state.simulationOutputDiscrepancy !== 'off' ||
    state.usDisclaimerOverride !== 'off' ||
    state.readonlyWallOverride !== 'off'
  );
}
