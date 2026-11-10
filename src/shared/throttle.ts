type AnyFunction = (this: unknown, ...args: never[]) => unknown;

/**
 * Trailing-capable throttle. `moderndash` throttle is leading-only, while the
 * call sites here rely on lodash's leading/trailing options.
 */
export function throttle<Fn extends AnyFunction>(
  fn: Fn,
  wait: number,
  { leading = true, trailing = true }: { leading?: boolean; trailing?: boolean } = {},
): Fn & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<Fn> | undefined;
  let lastThis: ThisParameterType<Fn> | undefined;
  let result: unknown;

  const invoke = (context: ThisParameterType<Fn> | undefined, args: Parameters<Fn>) => {
    result = fn.apply(context, args);
    return result;
  };

  const throttled = function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    lastArgs = args;
    // oxlint-disable-next-line typescript/no-this-alias -- needed for trailing invocation
    lastThis = this;
    if (timeoutId === undefined) {
      if (leading) {
        invoke(this, args);
        lastArgs = undefined;
      }
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        if (trailing && lastArgs !== undefined) {
          invoke(lastThis, lastArgs);
          lastArgs = undefined;
          lastThis = undefined;
        }
      }, wait);
    }
    return result;
  } as Fn & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastArgs = undefined;
    lastThis = undefined;
  };

  return throttled;
}
