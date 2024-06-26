import { produce } from 'immer';
import ky from 'ky';
import type { Options } from 'ky';
import type { Account } from 'src/background/account/Account';
import { PersistentStore } from 'src/modules/persistent-store';
import { version } from 'src/shared/packageVersion';
import { MIXPANEL_TOKEN_PUBLIC } from 'src/env/config';
import { invariant } from '../invariant';
import { Loglevel, logTable, logToConsole } from '../logger';
import { getBaseMixpanelParams } from './shared/mixpanel-data-helpers';

const mixPanelToken = MIXPANEL_TOKEN_PUBLIC;

if (!mixPanelToken) {
  // eslint-disable-next-line no-console
  console.warn('MIXPANEL_TOKEN_PUBLIC env var not found.');
}

class DeviceIdStore extends PersistentStore<string | undefined> {
  constructor() {
    super(undefined, 'deviceUUID');
    this.ready().then(() => {
      const value = this.getState();
      if (!value) {
        this.setState(crypto.randomUUID());
      }
    });
  }

  async getSavedState() {
    const value = await super.getSavedState();
    invariant(value, 'value must be generated upon initialization');
    return value;
  }
}

function omitNullParams<T extends Record<string, unknown>>(
  params: T
): Partial<T> {
  return produce(params, (draft) => {
    for (const key in draft) {
      if (draft[key] == null) {
        delete draft[key];
      }
    }
  });
}

const deviceIdStore = new DeviceIdStore();

class MixpanelApi {
  /**
   * Mixpanel flow:
   *
   * ## Events
   * Events are sent to /track endpoint.
   * They include $device_id, $user_id, distinct_id, $insert_id
   * $device_id is persisted for current device
   * $user_id is sent when its known
   * distinct_id is equal to "$device:<$device_id>" before $user_id is known,
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
         $anon_distinct_id: "$device:<$device_id>",
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
  userId?: string;
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
        distinct_id: this.userId ?? `$device:${this.deviceId}`,
        token: this.token,
        ...values,
        ...(this.userId
          ? {
              $user_id: this.userId,
              // duplicated user_id is a current product requirement
              user_id: this.userId,
            }
          : null),
      }),
    };

    logToConsole(Loglevel.info, 'group', `Mixpanel track: ${payload.event}`);
    logTable(Loglevel.info, payload.properties, ['index']);
    logToConsole(Loglevel.info, 'groupEnd');

    return this.sendEvent(url.toString(), { json: [payload] });
  }

  async engage(userProfileProperties: Record<string, unknown>) {
    const url = new URL('/engage', this.url);
    if (this.debugMode) {
      url.searchParams.append('verbose', '1');
    }
    url.searchParams.append('ip', '1');
    if (!this.userId) {
      // eslint-disable-next-line no-console
      console.warn('Must not call engage() method without a user id');
      return;
    }
    const payload = omitNullParams({
      $device_id: this.deviceId,
      $distinct_id: this.userId,
      $user_id: this.userId,
      token: this.token,
      $set: userProfileProperties,
    });

    logToConsole(Loglevel.info, 'group', 'Mixpanel engage');
    logTable(Loglevel.info, payload, ['index']);
    logTable(Loglevel.info, payload.$set);
    logToConsole(Loglevel.info, 'groupEnd');

    return this.sendEvent(url.toString(), { json: [payload] });
  }

  async identify(
    userId: string,
    userProfileProperties: Record<string, unknown>
  ) {
    await this.ready();
    this.userId = userId;
    const $anon_distinct_id = `$device:${this.deviceId}`;
    return Promise.all([
      // TODO: "$identify" track event is not necessary?
      this.track('$identify', { $anon_distinct_id }),
      this.engage(userProfileProperties),
    ]);
  }

  async sendEvent(url: string, options: Options) {
    if (this.token != null && this.sendRequestsOverTheNetwork) {
      return ky.post(url, options);
    }
  }

  reset() {
    // we're not resetting "super" properties because in our case
    // they're not user-specific
    this.userId = undefined;
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
  account: Account,
  event: string,
  values: Record<string, unknown>
) {
  const userId = account.getUser()?.id;
  mixpanelApi.track(event, {
    ...values,
    // pass userId params cause identify function can still be in progress
    ...(userId ? { user_id: userId, $user_id: userId } : null),
  });
}

export async function mixpanelIdentify(account: Account) {
  const userId = account.getUser()?.id;
  if (!userId) {
    return;
  }
  try {
    const userProfileProperties = await getBaseMixpanelParams(account);
    return mixpanelApi.identify(userId, userProfileProperties);
  } catch (e) {
    // TODO: setup "error" event in background emitter and send errors to metabase
    // eslint-disable-next-line no-console
    console.warn('Failed to identify (mixpanel)', e);
  }
}

export async function mixpanelReset() {
  mixpanelApi.reset();
}
