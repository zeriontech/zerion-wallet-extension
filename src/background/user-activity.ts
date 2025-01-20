import browser from 'webextension-polyfill';
import * as browserStorage from 'src/background/webapis/storage';
import { PersistentStore } from 'src/modules/persistent-store';
import { emitter } from './events';
import { globalPreferences } from './Wallet/GlobalPreferences';

export function trackLastActive() {
  emitter.on('userActivity', () => {
    browserStorage.set('lastActive', Date.now());
  });
}

async function getLastActive() {
  return await browserStorage.get<number>('lastActive');
}

export function scheduleAlarms() {
  emitter.on('accountsChanged', () => {
    // To my understanding, if an alarm with an existing name is created, it's
    // not gonna create duplicate alarms. Only one will be active and that's what we need
    browser.alarms.create('lastActiveCheck', {
      periodInMinutes: 1,
    });
  });

  emitter.on('sessionExpired', () => {
    // Stop alarm when user is logged out to
    browser.alarms.clear('lastActiveCheck');
  });
}

async function getIdleTimeout() {
  const preferences = await globalPreferences.getPreferences();
  return preferences.autoLockTimeout;
}

export async function expireSessionIfNeeded() {
  const lastActive = await getLastActive();
  const autoLockTimeout = await getIdleTimeout();
  if (autoLockTimeout === 'none') {
    return;
  }
  if (lastActive && Date.now() - lastActive > autoLockTimeout) {
    emitter.emit('sessionExpired');
  }
}

export async function handleAlarm(alarm: browser.Alarms.Alarm) {
  if (alarm.name === 'lastActiveCheck') {
    await expireSessionIfNeeded();
  }
}

// TODO: use LocallyEncrypted value for {{ address: LocallyEncrypted } | undefined}
type State = { address: string; walletModelId: string } | null; // Record< | undefined>;
class LastUsedAddressStore extends PersistentStore<State> {}

const STORAGE_KEY = 'last-used-address';
export const lastUsedAddressStore = new LastUsedAddressStore(null, STORAGE_KEY);
