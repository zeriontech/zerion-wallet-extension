/**
 * Wraps an event listener so that it runs only while the user has analytics
 * enabled. The preference is read on every call, so a change takes effect on
 * the next event.
 */
export function whenAnalyticsEnabled<Args extends unknown[]>(
  isEnabled: () => Promise<boolean>,
  listener: (...args: Args) => void | Promise<void>,
) {
  return async (...args: Args): Promise<void> => {
    if (!(await isEnabled())) {
      return;
    }
    await listener(...args);
  };
}
