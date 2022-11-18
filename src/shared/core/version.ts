import browser from 'webextension-polyfill';
import { get, set } from 'src/background/webapis/storage';

const STORAGE_VERSION = 0.2;

async function getCurrentVersion() {
  const saved = await get<number | string>('STORAGE_VERSION');
  return saved ?? 'no-version';
}

const upgrades: Record<string | number, () => Promise<void>> = {
  'no-version': async () => {
    await set('STORAGE_VERSION', 'no-version');
    // A strategy to wait for some event is possible here,
    // e.g. we could wait for an update to STORAGE_VERSION storage key
    // and then continue
  },
};

export async function prepareStorage() {
  const hasSomeData = Boolean(await get('currentUser'));
  const storageVersion = await getCurrentVersion();
  if (!hasSomeData) {
    set('STORAGE_VERSION', STORAGE_VERSION);
    return;
  } else if (storageVersion !== STORAGE_VERSION) {
    if (storageVersion in upgrades) {
      // TODO: run upgrades in sequence for each version
      return upgrades[storageVersion]();
    }
  }
  return 'ok';
}

export async function checkVersion() {
  const storageVersion = await getCurrentVersion();
  if (storageVersion !== STORAGE_VERSION) {
    return {
      storageVersion: {
        mismatch: true,
        // action: storageVersion === 'no-version' ? 'clear-storage' : undefined,
        action: 'clear-storage',
      },
    };
  }
}

export async function eraseAndUpdateToLatestVersion() {
  await browser.storage.local.clear();
  await set('STORAGE_VERSION', STORAGE_VERSION);
}
