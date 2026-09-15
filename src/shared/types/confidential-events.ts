/**
 * Analytics events of the Confidential Balances feature. Mirrors the web
 * app's `confidentialDecrypt*` events so both apps emit the same Mixpanel
 * names and shapes. The wallet address is never part of the payload.
 */
export type ConfidentialDecryptTrigger = 'panel' | 'value';

export type ConfidentialAnalyticsEvent =
  | {
      name: 'dialogShown';
      params: { trigger: ConfidentialDecryptTrigger; permit_count: number };
    }
  | { name: 'decryptStarted'; params: { permit_count: number } }
  | { name: 'permitSigned'; params: { chain: string; index: number } }
  | { name: 'decryptCompleted'; params: { permit_count: number } }
  | {
      name: 'decryptFailed';
      params: { index: number; reason: 'rejected' | 'error' };
    }
  | {
      name: 'decryptDismissed';
      params: { stage: 'intro' | 'signing' | 'failed' };
    };

export const CONFIDENTIAL_EVENT_NAMES: Record<
  ConfidentialAnalyticsEvent['name'],
  string
> = {
  dialogShown: 'General: Confidential Decrypt Dialog Shown',
  decryptStarted: 'General: Confidential Decrypt Started',
  permitSigned: 'General: Confidential Permit Signed',
  decryptCompleted: 'General: Confidential Decrypt Completed',
  decryptFailed: 'General: Confidential Decrypt Failed',
  decryptDismissed: 'General: Confidential Decrypt Dismissed',
};
