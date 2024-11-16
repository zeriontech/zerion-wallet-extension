import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import * as browserStorage from 'src/background/webapis/storage';

const referrerKey = 'referral-program/referrer-2024-10-10';

export async function readSavedReferrerData() {
  return await browserStorage.get<ReferrerData>(referrerKey);
}

export async function saveReferrerData(referrerData: ReferrerData) {
  await browserStorage.set(referrerKey, referrerData);
}
