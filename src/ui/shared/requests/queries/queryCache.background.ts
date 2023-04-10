import type { QueryKey } from 'react-query';

export class QueryService {
  private cache: Record<string, unknown> = {};

  async getAll() {
    return this.cache;
  }

  async setQuery({ params }: { params: { key: QueryKey; value: unknown } }) {
    this.cache[JSON.stringify(params.key)] = params.value;
  }
}
