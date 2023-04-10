export class CacheService {
  private cache: Record<string, { timestamp: number; value: unknown }> = {};

  async getCache({ params }: { params: { key: string } }) {
    return this.cache[params.key];
  }

  async setCache({ params }: { params: { key: string; value: unknown } }) {
    this.cache[params.key] = { timestamp: Date.now(), value: params.value };
  }
}
