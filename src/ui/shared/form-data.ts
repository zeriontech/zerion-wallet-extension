import lodashSet from 'lodash/set';

export function naiveFormDataToObject(
  formData: FormData,
  modifier: (key: string, value: unknown) => unknown
) {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.endsWith('[]')) {
      const value = modifier(key, formData.getAll(key));
      lodashSet(result, key.slice(0, -2), value);
    } else {
      const value = modifier(key, formData.get(key));
      lodashSet(result, key, value);
    }
  }
  return result;
}

export type Parsers = Record<string, (untypedValue: unknown) => unknown>;

export function collectData(form: HTMLFormElement, parsers: Parsers) {
  return naiveFormDataToObject(new FormData(form), (key, untypedValue) => {
    if (parsers[key]) {
      return parsers[key](untypedValue);
    } else {
      return untypedValue as string;
    }
  });
}
