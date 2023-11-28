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
      periodInMinutes: 5, // Is this too frequent or too infrequent?
    });
  });

  emitter.on('sessionExpired', () => {
    // Stop alarm when user is logged out to
    browser.alarms.clear('lastActiveCheck');
  });
}

export async function handleAlarm(alarm: browser.Alarms.Alarm) {
  if (alarm.name === 'lastActiveCheck') {
    const lastActive = await getLastActive();
    // const ONE_DAY = 1000 * 60 * 60 * 24;
    const HALF_A_DAY = 1000 * 60 * 60 * 12;
    if (lastActive && Date.now() - lastActive > HALF_A_DAY) {
      emitter.emit('sessionExpired');
    }
  }
}
