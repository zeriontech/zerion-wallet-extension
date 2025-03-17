import browser from 'webextension-polyfill';
import { BrowserStorage } from 'src/background/webapis/storage';

export const STORAGE_VERSION = 0.4;

export async function getCurrentVersion() {
  const saved = await BrowserStorage.get<number | string>('STORAGE_VERSION');
  return saved ?? 'no-version';
}

export const checkExisingData = async () =>
  Boolean(await BrowserStorage.get('currentUser'));

export async function eraseAndUpdateToLatestVersion() {
  await browser.storage.local.clear();
  await BrowserStorage.set('STORAGE_VERSION', STORAGE_VERSION);
}
