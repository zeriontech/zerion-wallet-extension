import browser from 'webextension-polyfill';

export async function get<T>(prop: string) {
  const result = await browser.storage.local.get(prop);
  return result?.[prop] as T | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function set(prop: string, value: any) {
  await browser.storage.local.set({ [prop]: value });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function remove(prop: string) {
  await browser.storage.local.remove(prop);
}
