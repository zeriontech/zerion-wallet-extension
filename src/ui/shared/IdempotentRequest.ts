/**
 * Although this is a very naive implementation for an idemponent wrapper,
 * it helps with cases where we need to invoke mutations inside useEffect hooks,
 * which may be run more than once in react's concurrent mode
 */
export class IdempotentRequest {
  private map: Record<string, Promise<unknown>> = {};

  request<T>(key: string, cb: () => Promise<T>): Promise<T> {
    if (!this.map[key]) {
      this.map[key] = cb();
      this.map[key].then(() => {
        delete this.map[key];
      });
    }
    return this.map[key] as Promise<T>;
  }
}
