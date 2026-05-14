// Hyperliquid `userAbstraction` /info response. The wire returns a raw JSON
// string. Documented modes from the iOS implementation are `disabled` /
// `dexAbstraction` / `unifiedAccount` / `portfolioMargin`; the live endpoint
// also returns `default` for the no-abstraction classic state.
export type AbstractionMode =
  | 'disabled'
  | 'dexAbstraction'
  | 'unifiedAccount'
  | 'portfolioMargin';

export interface UserAbstractionPayload {
  address: string;
}

const KNOWN_MODES: AbstractionMode[] = [
  'disabled',
  'dexAbstraction',
  'unifiedAccount',
  'portfolioMargin',
];

// Map any unrecognised wire value (including the live `default`) to `disabled`
// so legacy math is used. Keeps us forward-compatible with Hyperliquid adding
// a new mode without breaking refresh.
export function parseAbstractionMode(value: unknown): AbstractionMode {
  if (typeof value === 'string' && (KNOWN_MODES as string[]).includes(value)) {
    return value as AbstractionMode;
  }
  return 'disabled';
}

export function isUnifiedMode(mode: AbstractionMode): boolean {
  return mode === 'unifiedAccount' || mode === 'portfolioMargin';
}
