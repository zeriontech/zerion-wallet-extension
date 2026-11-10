import { produce } from 'immer';

export function omitNullParams<T extends object>(params: T): Partial<T> {
  return produce(params, (draft) => {
    const record = draft as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (record[key] == null) {
        delete record[key];
      }
    }
  });
}
