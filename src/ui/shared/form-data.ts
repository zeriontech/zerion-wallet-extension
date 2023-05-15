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
