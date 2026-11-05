import {
  getNetworkFeeLevelColor,
  shouldShowNetworkFeeLevelLabel,
} from './constants';

describe('network fee level label', () => {
  test('keeps Fast quiet and non-Fast levels in the notice colour', () => {
    expect(getNetworkFeeLevelColor('fast')).toBe('var(--neutral-500)');
    expect(getNetworkFeeLevelColor('average')).toBe('var(--notice-500)');
    expect(getNetworkFeeLevelColor('custom')).toBe('var(--notice-500)');
  });

  test('shows every level by default', () => {
    expect(shouldShowNetworkFeeLevelLabel('fast')).toBe(true);
    expect(shouldShowNetworkFeeLevelLabel('average')).toBe(true);
    expect(shouldShowNetworkFeeLevelLabel('custom')).toBe(true);
  });
});
