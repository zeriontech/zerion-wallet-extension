type PublicMethodParams<T = undefined> = T extends undefined
  ? never
  : { params: T };

type Key = string | number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any;

export class MemoryCacheRPC {
  private map: Map<Key, Value>;

  constructor() {
    this.map = new Map();
  }

  async set({
    params: { key, value },
  }: PublicMethodParams<{ key: Key; value: Value }>): Promise<void> {
    this.map.set(key, value);
  }

  async get({ params: { key } }: PublicMethodParams<{ key: Key }>) {
    return this.map.get(key);
  }

  async getAll(): Promise<Record<string, Value>> {
    return Object.fromEntries(this.map);
  }
}
