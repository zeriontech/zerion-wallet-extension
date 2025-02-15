import {
  GOOGLE_ANALYTICS_API_SECRET,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
} from 'src/env/config';
import type { Options } from 'ky';
import ky from 'ky';
import { version } from 'src/shared/packageVersion';
import type { Account } from 'src/background/account/Account';
import { Loglevel, logTable, logToConsole } from '../logger';
import { deviceIdStore } from './shared/DeviceIdStore';
import { omitNullParams } from './shared/omitNullParams';

if (!GOOGLE_ANALYTICS_API_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_ANALYTICS_API_SECRET env var not found');
}
if (!GOOGLE_ANALYTICS_MEASUREMENT_ID) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_ANALYTICS_MEASUREMENT_ID env var not found');
}

type GoogleAnalyticsEvent =
  | 'page_view'
  | 'signed_message'
  | 'signed_transaction';

class GoogleAnalyticsApi {
  baseParams?: Record<string, unknown>;
  deviceId?: string;
  sessionId?: string;
  url: string;
  apiSecret: string | null;
  measurementId: string | null;
  debugMode: boolean;
  private sendRequestsOverTheNetwork: boolean;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  constructor({
    url = 'https://www.google-analytics.com',
    apiSecret,
    measurementId,
    debugMode = false,
    sendRequestsOverTheNetwork = true,
    resolveDeviceId,
  }: {
    url?: string;
    apiSecret: string | null;
    measurementId: string | null;
    debugMode?: boolean;
    sendRequestsOverTheNetwork?: boolean;
    resolveDeviceId: () => Promise<string>;
  }) {
    this.url = url;
    this.apiSecret = apiSecret;
    this.measurementId = measurementId;
    this.debugMode = debugMode;
    this.sendRequestsOverTheNetwork = sendRequestsOverTheNetwork;

    this.isReady = false;
    this.readyPromise = resolveDeviceId().then((value) => {
      this.deviceId = value;
      this.isReady = true;
    });
  }

  async ready(): Promise<void> {
    return this.isReady ? Promise.resolve() : this.readyPromise;
  }

  setBaseParams(values: Record<string, unknown>) {
    this.baseParams = values;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  async collect(event: GoogleAnalyticsEvent, values: Record<string, unknown>) {
    if (!this.sessionId) {
      // eslint-disable-next-line no-console
      console.warn('Must not call collect() method without a session id');
      return;
    }

    await this.ready();

    const url = new URL('/mp/collect', this.url);
    if (this.apiSecret) {
      url.searchParams.append('api_secret', this.apiSecret);
    }
    if (this.measurementId) {
      url.searchParams.append('measurement_id', this.measurementId);
    }
    if (this.debugMode) {
      url.searchParams.append('debug_mode', '1');
    }

    const eventPayload = {
      name: event,
      params: omitNullParams({
        ...this.baseParams,
        ...values,
        // Both session_id and engagement_time_msec are recommended parameters when
        // using the Google Analytics Measurement Protocol as they are required
        // for user activity to display in standard reports like Realtime.
        // See: https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4?hl=en
        session_id: this.sessionId,
        engagement_time_msec: 100,
      }),
    };

    const payload = {
      client_id: this.deviceId,
      events: [eventPayload],
    };

    logToConsole(
      Loglevel.info,
      'group',
      `Google Analytics collect: ${eventPayload.name}`
    );
    logTable(Loglevel.info, eventPayload.params, ['index']);
    logToConsole(Loglevel.info, 'groupEnd');

    return this.sendEvent(url.toString(), { json: [payload] });
  }

  async sendEvent(url: string, options: Options) {
    if (
      this.apiSecret != null &&
      this.measurementId != null &&
      this.sendRequestsOverTheNetwork
    ) {
      return ky.post(url, options);
    }
  }

  clearSessionId() {
    this.sessionId = undefined;
  }
}

const googleAnalyticsApi = new GoogleAnalyticsApi({
  apiSecret: GOOGLE_ANALYTICS_API_SECRET ?? null,
  measurementId: GOOGLE_ANALYTICS_MEASUREMENT_ID ?? null,
  resolveDeviceId: () => deviceIdStore.getSavedState(),
  debugMode: process.env.NODE_ENV !== 'production',
  sendRequestsOverTheNetwork: process.env.NODE_ENV === 'production',
});

Object.assign(globalThis, { googleAnalyticsApi });

googleAnalyticsApi.setBaseParams({
  origin: globalThis.location.origin,
  app_version: version,
});

export function gaBeginSession(account: Account) {
  const userId = account.getUser()?.id;
  if (!userId) {
    return;
  }
  googleAnalyticsApi.setSessionId(userId);
}

export async function gaEndSession() {
  googleAnalyticsApi.clearSessionId();
}

export async function gaCollect(
  account: Account,
  event: GoogleAnalyticsEvent,
  values: Record<string, unknown>
) {
  const userId = account.getUser()?.id;
  googleAnalyticsApi.collect(event, {
    ...values,
    ...(userId ? { user_id: userId } : null),
  });
}
