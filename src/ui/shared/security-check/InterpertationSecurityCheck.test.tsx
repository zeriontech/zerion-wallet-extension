import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  Warning,
  WarningSeverity,
} from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import { WarningList } from './WarningList';
import { getSecurityCheckView, getWarningKey, getWarningKind } from './warningPresentation';

function warning(
  severity: WarningSeverity,
  title: string,
  description = `${title} description`,
): Warning {
  return { severity, title, description, details: '' };
}

function render(warnings: Warning[]) {
  return renderToStaticMarkup(<WarningList warnings={warnings} />);
}

describe('getWarningKind', () => {
  test.each([
    ['Red', 'danger'],
    ['Orange', 'danger'],
    ['Yellow', 'warning'],
    ['Gray', 'info'],
  ] as const)('%s maps to %s', (severity, kind) => {
    expect(getWarningKind(severity)).toBe(kind);
  });
});

describe('getSecurityCheckView', () => {
  test('a Gray-only successful simulation is not Unverified and has no error dialog', () => {
    expect(getSecurityCheckView('success', 'Gray')).toEqual({
      kind: 'ok',
      title: 'No Risks Found',
      dialog: 'success',
    });
  });

  test('an actual query error keeps the Unverified copy and the error dialog', () => {
    expect(getSecurityCheckView('error', 'Gray')).toEqual({
      kind: 'unknown',
      title: 'Unverified',
      dialog: 'error',
    });
  });

  test.each([
    ['Red', 'danger'],
    ['Orange', 'danger'],
    ['Yellow', 'warning'],
  ] as const)('%s keeps the Risks Found treatment', (severity, kind) => {
    expect(getSecurityCheckView('success', severity)).toEqual({
      kind,
      title: 'Risks Found',
      dialog: null,
    });
  });

  test('no warnings is a successful check', () => {
    expect(getSecurityCheckView('success')).toEqual({
      kind: 'ok',
      title: 'No Risks Found',
      dialog: 'success',
    });
  });

  test('loading wins over warnings', () => {
    expect(getSecurityCheckView('loading', 'Red')).toEqual({
      kind: 'loading',
      title: 'Simulating...',
      dialog: 'loading',
    });
  });
});

describe('WarningList', () => {
  test('renders a Gray-only warning as a neutral info card', () => {
    const markup = render([
      warning('Gray', 'Safe transaction', 'Balance changes shown are for Safe'),
    ]);
    expect(markup).toContain('Safe transaction');
    expect(markup).toContain('Balance changes shown are for Safe');
    expect(markup).toContain('var(--neutral-600)');
    expect(markup).not.toContain('var(--negative-500)');
  });

  test('colors each card by its own severity', () => {
    const markup = render([
      warning('Orange', 'This transaction will fail'),
      warning('Gray', 'Safe transaction'),
    ]);
    expect(markup).toContain('This transaction will fail');
    expect(markup).toContain('Safe transaction');
    expect(markup).toContain('var(--negative-500)');
    expect(markup).toContain('var(--neutral-600)');
  });

  test('keys stay unique when titles repeat', () => {
    const first = warning('Red', 'Safe settings change', 'First change');
    const second = warning('Red', 'Safe settings change', 'Second change');
    expect(getWarningKey(first, 0)).not.toBe(getWarningKey(second, 1));
    expect(render([first, second]).match(/Safe settings change/g)).toHaveLength(2);
  });
});
