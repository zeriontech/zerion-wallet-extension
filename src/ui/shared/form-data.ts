import lodashSet from 'lodash/set';

export function naiveFormDataToObject<T>(
  formData: FormData,
  modifier: (key: keyof T | string, value: unknown) => unknown
) {
  const result: Partial<{ [K in keyof T]: T[K] } & Record<string, unknown>> =
    {};
  for (const key of new Set(formData.keys())) {
    if (key.endsWith('[]')) {
      const value = modifier(key, formData.getAll(key));
      lodashSet(result, key.slice(0, -2), value);
    } else {
      const value = modifier(key, formData.get(key));
      lodashSet(result, key, value);
    }
  }
  return result as { [K in keyof T]: T[K] } & Record<string, string>;
}

export type Parsers<T> = { [K in keyof T]: (value: unknown) => T[K] };

export function collectData<T>(form: HTMLFormElement, parsers: Parsers<T>) {
  return naiveFormDataToObject<T>(new FormData(form), (key, untypedValue) => {
    if (parsers[key as keyof T]) {
      return parsers[key](untypedValue);
    } else {
      return untypedValue as string;
    }
  });
}
