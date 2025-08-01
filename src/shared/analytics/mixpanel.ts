import ky from 'ky';
import type { Options } from 'ky';
import type { Account } from 'src/background/account/Account';
import { version } from 'src/shared/packageVersion';
import { MIXPANEL_TOKEN_PUBLIC } from 'src/env/config';
import { Loglevel, logTable, logToConsole } from '../logger';
import { getUserProperties } from './shared/getUserProperties';
import { deviceIdStore } from './shared/DeviceIdStore';
import { omitNullParams } from './shared/omitNullParams';
import { getAnalyticsId } from './analyticsId';

const mixPanelToken = MIXPANEL_TOKEN_PUBLIC;

if (!mixPanelToken) {
  // eslint-disable-next-line no-console
  console.warn('MIXPANEL_TOKEN_PUBLIC env var not found.');
}

class MixpanelApi {
  /**
   * Mixpanel flow:
   *
   * ## Events
   * Events are sent to /track endpoint.
   * They include $device_id, $user_id, distinct_id, $insert_id
   * $device_id is persisted for current device
   * $user_id is sent when its known
   * distinct_id is equal to $device_id before $user_id is known,
   *              and equal to $user_id when $user_id is known
   * $insert_id is always unique per new request
   *
   * ## Identification
   * When $user_id first becomes known,
   * 2 events are sent:
   * /track event: (TODO: is this not required?)
   * {
       event: "$identify",
       properties: {
         $anon_distinct_id: $device_id,
         $user_id: "user-id",
         distinct_id: "user-id",
         ..., // base properties
       }
   * }
   *
   * /engage event:
   * {
        $set_once?: { ... },
        $set?: { ... },
        $token: ...,
        $distinct_id: "user-id",
        $device_id: "<$device_id>",
        $user_id: "user-id"
     }
   *
   * ## User Profile Properties
   * After "Identification" step, user profile properties can be set
   * by sending the following to the /engage endpoint:
   * {
        $set: {
            some_user_property: "hello",
            ..., // user profile properties
        },
        $token: ...,
        $distinct_id: "user-id",
        $device_id: "<$device_id>",
        $user_id: "user-id"
     }
   *
   * ## Questions
   * Once user id becomes known,
   * can a /track event with $user_id: "user-id" and $distinct_id: "user-id"
   * precede /engage and "$identify" events?
   */
  baseProperties?: Record<string, unknown>;
  deviceId?: string;
  url: string;
  token: string | null;
  debugMode: boolean;
  private sendRequestsOverTheNetwork: boolean;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  constructor({
    token,
    url = 'https://api.mixpanel.com',
    debugMode = false,
    sendRequestsOverTheNetwork = true,
    resolveDeviceId,
  }: {
    token: string | null;
    url?: string;
    debugMode?: boolean;
    sendRequestsOverTheNetwork?: boolean;
    resolveDeviceId: () => Promise<string>;
  }) {
    this.url = url;
    this.token = token;
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

  setBaseProperties(values: Record<string, unknown>) {
    this.baseProperties = values;
  }

  async track(event: string, values: Record<string, unknown>) {
    await this.ready();
    const url = new URL('/track', this.url);
    if (this.debugMode) {
      url.searchParams.append('verbose', '1');
    }
    url.searchParams.append('ip', '1');
    const payload = {
      event,
      properties: omitNullParams({
        ...this.baseProperties,
        time: Date.now() / 1000,
        $insert_id: crypto.randomUUID(),
        $device_id: this.deviceId,
        distinct_id: values.userId,
        token: this.token,
        ...values,
      }),
    };

    logToConsole(Loglevel.info, 'group', `Mixpanel track: ${payload.event}`);
    logTable(Loglevel.info, payload.properties, ['index']);
    logToConsole(Loglevel.info, 'groupEnd');

    return this.sendEvent(url.toString(), { json: [payload] });
  }

  async engage(userId: string, userProfileProperties: Record<string, unknown>) {
    const url = new URL('/engage', this.url);
    if (this.debugMode) {
      url.searchParams.append('verbose', '1');
    }
    url.searchParams.append('ip', '1');
    const payload = omitNullParams({
      $device_id: this.deviceId,
      $distinct_id: userId,
      $user_id: userId,
      token: this.token,
      $set: userProfileProperties,
    });

    logToConsole(Loglevel.info, 'group', 'Mixpanel engage');
    logTable(Loglevel.info, payload, ['index']);
    logTable(Loglevel.info, payload.$set);
    logToConsole(Loglevel.info, 'groupEnd');

    return this.sendEvent(url.toString(), { json: [payload] });
  }

  async identify(userProfileProperties: Record<string, unknown>) {
    await this.ready();
    const userId = await getAnalyticsId();
    const $anon_distinct_id = this.deviceId;
    return Promise.all([
      // TODO: "$identify" track event is not necessary?
      // $identify event can help to merge users if event is sent before actual user ID is known
      // and device ID is used instead
      this.track('$identify', { $anon_distinct_id }),
      this.engage(userId, userProfileProperties),
    ]);
  }

  async sendEvent(url: string, options: Options) {
    if (this.token != null && this.sendRequestsOverTheNetwork) {
      return ky.post(url, options);
    }
  }
}

const mixpanelApi = new MixpanelApi({
  token: mixPanelToken ?? null,
  resolveDeviceId: () => deviceIdStore.getSavedState(),
  debugMode: process.env.NODE_ENV !== 'production',
  sendRequestsOverTheNetwork: process.env.NODE_ENV === 'production',
});

Object.assign(globalThis, { mixpanelApi });

mixpanelApi.setBaseProperties({
  origin: globalThis.location.origin,
  app_version: version,
});

export async function mixpanelTrack(
  event: string,
  values: Record<string, unknown>
) {
  const userId = await getAnalyticsId();
  mixpanelApi.track(event, {
    ...values,
    // pass userId params cause identify function can still be in progress
    ...{ user_id: userId, $user_id: userId },
  });
}

export async function mixpanelIdentify(account: Account) {
  try {
    const userProfileProperties = await getUserProperties(account);
    return mixpanelApi.identify(userProfileProperties);
  } catch (e) {
    // TODO: setup "error" event in background emitter and send errors to metabase
    // eslint-disable-next-line no-console
    console.warn('Failed to identify (mixpanel)', e);
  }
}
