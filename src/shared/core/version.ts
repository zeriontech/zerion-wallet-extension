import browser from 'webextension-polyfill';
import {
  BrowserStorage,
  clearStorageArtefacts,
} from 'src/background/webapis/storage';
import { Account } from 'src/background/account/Account';

const STORAGE_VERSION = 0.4;

async function getCurrentVersion() {
  const saved = await BrowserStorage.get<number | string>('STORAGE_VERSION');
  return saved ?? 'no-version';
}

const upgrades: Record<string | number, () => Promise<null | number>> = {
  'no-version': async () => {
    await BrowserStorage.set('STORAGE_VERSION', 'no-version');
    // A strategy to wait for some event is possible here,
    // e.g. we could wait for an update to STORAGE_VERSION storage key
    // and then continue
    return null; // null means stop upgrading. This is used when a UI interaction is needed to continue
  },
  '0.3': async () => {
    await Account.migrateCredentialsIfNeeded();
    await clearStorageArtefacts();
    const next = 0.4;
    await BrowserStorage.set('STORAGE_VERSION', next);
    return next;
  },
};

const checkExisingData = async () =>
  Boolean(await BrowserStorage.get('currentUser'));

export async function prepareStorage() {
  const hasSomeData = await checkExisingData();
  const storageVersion = await getCurrentVersion();
  if (!hasSomeData) {
    BrowserStorage.set('STORAGE_VERSION', STORAGE_VERSION);
    return;
  } else if (storageVersion !== STORAGE_VERSION) {
    let next: null | number | string = storageVersion;
    while (next && next in upgrades) {
      next = await upgrades[storageVersion]();
    }
  }
  return 'ok';
}

export async function checkVersion() {
  const [hasSomeData, storageVersion] = await Promise.all([
    checkExisingData(),
    getCurrentVersion(),
  ]);
  if (hasSomeData && storageVersion !== STORAGE_VERSION) {
    return {
      storageVersion: {
        mismatch: true,
        // action: storageVersion === 'no-version' ? 'clear-storage' : undefined,
        action: 'clear-storage',
      },
    };
  }
  return null;
}

export async function eraseAndUpdateToLatestVersion() {
  await browser.storage.local.clear();
  await BrowserStorage.set('STORAGE_VERSION', STORAGE_VERSION);
}
