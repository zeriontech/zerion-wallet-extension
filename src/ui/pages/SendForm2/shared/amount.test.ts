import { isAmountEntered, isZeroAmount } from './amount';

test('isAmountEntered', () => {
  // A deliberate zero counts as entered
  expect(isAmountEntered('0')).toBe(true);
  expect(isAmountEntered('0.')).toBe(true);
  expect(isAmountEntered('0.000')).toBe(true);
  expect(isAmountEntered('00')).toBe(true);

  // Regular amounts
  expect(isAmountEntered('1')).toBe(true);
  expect(isAmountEntered('1.5')).toBe(true);
  expect(isAmountEntered('.5')).toBe(true);

  // Placeholder state and not-yet-numeric partial input
  expect(isAmountEntered(null)).toBe(false);
  expect(isAmountEntered(undefined)).toBe(false);
  expect(isAmountEntered('')).toBe(false);
  expect(isAmountEntered('.')).toBe(false);

  // Only the input's own decimal notation passes; URL-injected
  // alternatives do not
  expect(isAmountEntered('-1')).toBe(false);
  expect(isAmountEntered('+1')).toBe(false);
  expect(isAmountEntered('0x0')).toBe(false);
  expect(isAmountEntered('1e3')).toBe(false);
  expect(isAmountEntered('1,5')).toBe(false);
  expect(isAmountEntered(' 1')).toBe(false);
  expect(isAmountEntered('Infinity')).toBe(false);
});

test('isZeroAmount', () => {
  expect(isZeroAmount('0')).toBe(true);
  expect(isZeroAmount('0.')).toBe(true);
  expect(isZeroAmount('0.000')).toBe(true);
  expect(isZeroAmount('00')).toBe(true);

  expect(isZeroAmount('1')).toBe(false);
  expect(isZeroAmount('0.001')).toBe(false);

  // Not entered → not a zero amount either
  expect(isZeroAmount(null)).toBe(false);
  expect(isZeroAmount('')).toBe(false);
  expect(isZeroAmount('.')).toBe(false);
  expect(isZeroAmount('-0')).toBe(false);
});
