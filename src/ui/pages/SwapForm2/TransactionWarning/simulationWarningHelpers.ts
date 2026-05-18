import type {
  InterpretResponse,
  Warning as SimulationWarning,
  WarningSeverity,
} from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';

export type WarningVariant = 'warning' | 'error';

export interface WarningContent {
  variant: WarningVariant;
  title: string;
  description?: string;
}

export type SimulationResult =
  | InterpretResponse
  | SignatureInterpretResponse
  | null;

export interface ResolvedTransactionWarning {
  warning: WarningContent | null;
  unverified: boolean;
  blocksAutoSign: boolean;
  dangerTitle: 'Proceed Anyway' | null;
}

const SEVERITY_RANK: Record<WarningSeverity, number> = {
  Red: 3,
  Orange: 2,
  Yellow: 1,
  Gray: 0,
};

export function pickHighestNonGray(
  warnings: SimulationWarning[]
): SimulationWarning | null {
  let best: SimulationWarning | null = null;
  for (const w of warnings) {
    if (w.severity === 'Gray') continue;
    if (
      best == null ||
      SEVERITY_RANK[w.severity] > SEVERITY_RANK[best.severity]
    ) {
      best = w;
    }
  }
  return best;
}

export function severityToVariant(severity: WarningSeverity): WarningVariant {
  return severity === 'Yellow' ? 'warning' : 'error';
}

export function readSimulationStatus(result: SimulationResult): string | null {
  if (!result || !('data' in result) || !result.data) return null;
  const action = (result.data as { action?: unknown }).action as
    | { status?: string }
    | null
    | undefined;
  return action?.status ?? null;
}

export function readSimulationWarnings(
  result: SimulationResult
): SimulationWarning[] {
  if (!result || !('data' in result) || !result.data) return [];
  const data = result.data as { warnings?: SimulationWarning[] };
  return data.warnings ?? [];
}
