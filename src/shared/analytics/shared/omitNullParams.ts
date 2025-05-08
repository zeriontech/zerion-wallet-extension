import { produce } from 'immer';

export function omitNullParams<T extends Record<string, unknown>>(
  params: T
): Partial<T> {
  return produce(params, (draft) => {
    for (const key in draft) {
      if (draft[key] == null) {
        delete draft[key];
      }
    }
  });
}
