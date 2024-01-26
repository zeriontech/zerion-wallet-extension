import browser from 'webextension-polyfill';
import * as browserStorage from 'src/background/webapis/storage';
import { emitter } from './events';

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
      periodInMinutes: 1, // Is this too frequent or too infrequent?
    });
  });

  emitter.on('sessionExpired', () => {
    // Stop alarm when user is logged out to
    browser.alarms.clear('lastActiveCheck');
  });
}

export function handleAlarm(getIdleTimeout: () => Promise<number>) {
  return async (alarm: browser.Alarms.Alarm) => {
    if (alarm.name === 'lastActiveCheck') {
      const lastActive = await getLastActive();
      const idleTimeout = await getIdleTimeout();
      if (idleTimeout && lastActive && Date.now() - lastActive > idleTimeout) {
        emitter.emit('sessionExpired');
      }
    }
  };
}
