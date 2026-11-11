import { isAmountEditPending } from './amountEditPending';

describe('isAmountEditPending', () => {
  it.each<[string, string | null, string | undefined, boolean]>([
    ['no edit in flight', null, '5', false],
    ['no edit in flight on an empty amount', null, undefined, false],
    ['token draft differs from the debounced amount', '6', '5', true],
    ['token draft over an empty amount', '5', undefined, true],
    ['token draft cleared over an amount', '', '5', true],
    ['token draft equals the debounced amount', '5', '5', false],
    ['token draft cleared over an empty amount', '', undefined, false],
    ['token partial decimal over the integer', '5.', '5', true],
    ['NFT draft differs from the debounced amount', '3', '2', true],
    ['NFT draft cleared over an amount', '', '2', true],
    ['NFT draft equals the debounced amount', '2', '2', false],
  ])('%s', (_name, draft, debounced, expected) => {
    expect(isAmountEditPending(draft, debounced)).toBe(expected);
  });
});
