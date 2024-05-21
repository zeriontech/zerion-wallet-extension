type Entry = { timestamp: number; value: unknown };

export class SessionCacheService {
  private cache: Record<string, Entry | undefined> = {};

  async getItem({ params }: { params: { key: string } }) {
    return this.cache[params.key];
  }

  async setItem({ params }: { params: { key: string; value: unknown } }) {
    this.cache[params.key] = { timestamp: Date.now(), value: params.value };
  }

  async removeItem({ params }: { params: { key: string } }) {
    delete this.cache[params.key];
  }
}
