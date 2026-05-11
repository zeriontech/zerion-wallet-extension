export type PriceImpactOverride = 'off' | '3' | '7' | '20';

export type SimulationWarningOverride = 'off' | 'Red' | 'Yellow' | 'Gray';

export type SimulationStatusOverride = 'off' | 'failed';

export type SimulationOutputDiscrepancy = 'off' | '50';

export interface DevMenuState {
  priceImpactOverride: PriceImpactOverride;
  simulationWarningOverride: SimulationWarningOverride;
  simulationStatusOverride: SimulationStatusOverride;
  simulationOutputDiscrepancy: SimulationOutputDiscrepancy;
}

export const DEFAULT_DEV_MENU_STATE: DevMenuState = {
  priceImpactOverride: 'off',
  simulationWarningOverride: 'off',
  simulationStatusOverride: 'off',
  simulationOutputDiscrepancy: 'off',
};
