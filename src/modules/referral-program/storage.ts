import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import { BrowserStorage } from 'src/background/webapis/storage';

const referrerKey = 'referral-program/referrer-2024-10-10';

export async function readSavedReferrerData() {
  return await BrowserStorage.get<ReferrerData>(referrerKey);
}

export async function saveReferrerData(referrerData: ReferrerData) {
  await BrowserStorage.set(referrerKey, referrerData);
}
