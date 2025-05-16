import { produce } from 'immer';

export function omitNullParams<T extends object>(params: T): Partial<T> {
  return produce(params, (draft) => {
    for (const key in draft) {
      if (draft[key] == null) {
        delete draft[key];
      }
    }
  });
}
