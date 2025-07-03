import {
  GOOGLE_ANALYTICS_API_SECRET,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
} from 'src/env/config';
import type { Options } from 'ky';
import ky from 'ky';
import { version } from 'src/shared/packageVersion';
import { Loglevel, logTable, logToConsole } from '../logger';
import { deviceIdStore } from './shared/DeviceIdStore';
import { omitNullParams } from './shared/omitNullParams';
import { getAnalyticsId } from './analyticsId';

if (!GOOGLE_ANALYTICS_API_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_ANALYTICS_API_SECRET env var not found');
}
if (!GOOGLE_ANALYTICS_MEASUREMENT_ID) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_ANALYTICS_MEASUREMENT_ID env var not found');
}

const USE_PAYLOAD_VALIDATION_ENDPOINT = false;

type GoogleAnalyticsEvent =
  | 'first_open'
  | 'page_view'
  | 'signed_message'
  | 'signed_transaction';

class GoogleAnalyticsApi {
  baseParams: null | Record<string, unknown>;
  deviceId: null | string;
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
    this.baseParams = null;
    this.deviceId = null;
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

  async collect(
    event: GoogleAnalyticsEvent,
    sessionId: string,
    values: Record<string, unknown>
  ) {
    await this.ready();

    const path =
      this.debugMode && USE_PAYLOAD_VALIDATION_ENDPOINT
        ? '/debug/mp/collect'
        : '/mp/collect';
    const url = new URL(path, this.url);

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
        session_id: sessionId,
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

    return this.sendEvent(url.toString(), { json: payload });
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
}

const googleAnalyticsApi = new GoogleAnalyticsApi({
  apiSecret: GOOGLE_ANALYTICS_API_SECRET ?? null,
  measurementId: GOOGLE_ANALYTICS_MEASUREMENT_ID ?? null,
  resolveDeviceId: () => deviceIdStore.getSavedState(),
  debugMode: process.env.NODE_ENV !== 'production',
  sendRequestsOverTheNetwork: process.env.NODE_ENV === 'production',
});

googleAnalyticsApi.setBaseParams({
  origin: globalThis.location.origin,
  app_version: version,
});

interface GoogleAnalyticsParams {
  params: Record<string, unknown>;
  sessionId: string | null;
}

export async function prepareGaParams(
  params: Record<string, unknown>
): Promise<GoogleAnalyticsParams> {
  const userId = await getAnalyticsId();
  return {
    params: {
      ...params,
      ...(userId ? { user_id: userId } : null),
    },
    // Google Analytics does not have a clear definition of a user session.
    // Hence, we need to define what a user session means within the extension.
    sessionId: userId || null,
  };
}

export async function gaCollect(
  event: GoogleAnalyticsEvent,
  { params, sessionId }: GoogleAnalyticsParams
) {
  if (!sessionId) {
    logToConsole(Loglevel.info, 'log', 'Google Analytics: No session id');
    return null;
  } else {
    return googleAnalyticsApi.collect(event, sessionId, params);
  }
}
