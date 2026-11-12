import { whenAnalyticsEnabled } from './whenAnalyticsEnabled';

describe('whenAnalyticsEnabled', () => {
  it('calls the listener with its arguments when analytics is enabled', async () => {
    const listener = vi.fn();
    const gated = whenAnalyticsEnabled(async () => true, listener);
    await gated('a', 1);
    expect(listener).toHaveBeenCalledWith('a', 1);
  });

  it('does not call the listener when analytics is disabled', async () => {
    const listener = vi.fn();
    const gated = whenAnalyticsEnabled(async () => false, listener);
    await gated('a', 1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('reads the preference on every call', async () => {
    let enabled = false;
    const listener = vi.fn();
    const gated = whenAnalyticsEnabled(async () => enabled, listener);
    await gated();
    enabled = true;
    await gated();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
