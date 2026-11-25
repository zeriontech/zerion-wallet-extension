import type {
  Warning,
  WarningSeverity,
} from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { TransactionWarningKind } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import type { SecurityButtonKind } from './SecurityStatusButton';

export type InterpretationMode = 'loading' | 'error' | 'success';

/** Each warning card takes its own severity, not the highest one's. */
export function getWarningKind(severity: WarningSeverity): TransactionWarningKind {
  switch (severity) {
    case 'Red':
    case 'Orange':
      return 'danger';
    case 'Yellow':
      return 'warning';
    default:
      return 'info';
  }
}

export function getWarningKey(warning: Warning, index: number) {
  // Titles repeat (e.g. two "Safe settings change" warnings), so the index is
  // what makes the key unique.
  return `${warning.severity}:${warning.title}:${index}`;
}

export type SecurityCheckDialog = InterpretationMode;

/**
 * Maps the query state and the highest warning severity to the security
 * status button. Gray is informational: a successfully simulated Safe
 * transaction must not read "Unverified" or open the "unable to simulate"
 * dialog.
 */
export function getSecurityCheckView(
  mode: InterpretationMode,
  warningSeverity?: WarningSeverity,
): {
  kind: SecurityButtonKind;
  title: string;
  dialog: SecurityCheckDialog | null;
} {
  if (mode === 'loading') {
    return { kind: 'loading', title: 'Simulating...', dialog: 'loading' };
  }
  if (mode === 'error') {
    return { kind: 'unknown', title: 'Unverified', dialog: 'error' };
  }
  switch (warningSeverity) {
    case 'Red':
    case 'Orange':
      return { kind: 'danger', title: 'Risks Found', dialog: null };
    case 'Yellow':
      return { kind: 'warning', title: 'Risks Found', dialog: null };
    default:
      return { kind: 'ok', title: 'No Risks Found', dialog: 'success' };
  }
}
