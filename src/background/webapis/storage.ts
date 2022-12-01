import browser from 'webextension-polyfill';

export async function get<T>(prop: string) {
  const result = await browser.storage.local.get(prop);
  return result?.[prop] as T | undefined;
}

export async function set(prop: string, value: unknown) {
  await browser.storage.local.set({ [prop]: value });
}

export async function remove(prop: string) {
  await browser.storage.local.remove(prop);
}

export async function clear() {
  await browser.storage.local.clear();
}
