export type PriceImpactOverride = 'off' | '3' | '7' | '20';

export type SimulationWarningOverride = 'off' | 'Red' | 'Yellow' | 'Gray';

export type SimulationStatusOverride = 'off' | 'failed';

export type SimulationOutputDiscrepancy = 'off' | '50';

export type USDisclaimerOverride = 'off' | 'force-on' | 'force-off';

export type ReadonlyWallOverride = 'off' | 'disabled';

/** `fake`: prepare-permits returns three fabricated permits (ethereum/base/arbitrum) */
export type ConfidentialPermitsOverride = 'off' | 'fake';

export interface DevMenuState {
  priceImpactOverride: PriceImpactOverride;
  simulationWarningOverride: SimulationWarningOverride;
  simulationStatusOverride: SimulationStatusOverride;
  simulationOutputDiscrepancy: SimulationOutputDiscrepancy;
  usDisclaimerOverride: USDisclaimerOverride;
  readonlyWallOverride: ReadonlyWallOverride;
  confidentialPermitsOverride: ConfidentialPermitsOverride;
}

export const DEFAULT_DEV_MENU_STATE: DevMenuState = {
  priceImpactOverride: 'off',
  simulationWarningOverride: 'off',
  simulationStatusOverride: 'off',
  simulationOutputDiscrepancy: 'off',
  usDisclaimerOverride: 'off',
  readonlyWallOverride: 'off',
  confidentialPermitsOverride: 'off',
};
