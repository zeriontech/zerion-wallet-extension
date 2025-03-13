import browser from 'webextension-polyfill';

export class BrowserStorage {
  static async get<T>(prop: string) {
    const result = await browser.storage.local.get(prop);
    return result?.[prop] as T | undefined;
  }

  static async set(prop: string, value: unknown) {
    await browser.storage.local.set({ [prop]: value });
  }

  static async remove(prop: string) {
    await browser.storage.local.remove(prop);
  }

  static async clear() {
    await browser.storage.local.clear();
  }
}

export class SessionStorage {
  static async get<T>(prop: string) {
    const result = await browser.storage.session.get(prop);
    return result?.[prop] as T | undefined;
  }

  static async set(prop: string, value: unknown) {
    await browser.storage.session.set({ [prop]: value });
  }

  static async remove(prop: string) {
    await browser.storage.session.remove(prop);
  }

  static async clear() {
    await browser.storage.session.clear();
  }
}

/**
 * This function helps to force-clear storage snapshots in /Local Extension Settings/
 * from the file system
 */
export async function clearStorageArtefacts() {
  const everything = await browser.storage.local.get(null);
  await browser.storage.local.clear(); // this removes local extension files
  await browser.storage.local.set(everything); // store everything back
}
