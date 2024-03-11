import ky from 'ky';
import type { Account } from 'src/background/account/Account';
import { PersistentStore } from 'src/modules/persistent-store';
import { version } from 'src/shared/packageVersion';
import { invariant } from '../invariant';
import { Loglevel, logTable } from '../logger';
import { getBaseMixpanelParams } from './shared/mixpanel-data-helpers';

// TODO: move to src/env/config.ts
const mixPanelTokenDev = 'a30959c6848ddba6ee5cb8feda61922f';
const mixPanelTokenProd = '1713511ace475d2c78689b3d66558b62';
const mixPanelToken =
  process.env.NODE_ENV === 'production' ? mixPanelTokenProd : mixPanelTokenDev;

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

const deviceIdStore = new DeviceIdStore();

class MixpanelApi {
  baseProperties?: Record<string, unknown>;
  deviceId?: string;
  url: string;
  token: string;
  debugMode: boolean;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  constructor({
    token,
    url = 'https://api.mixpanel.com/track',
    debugMode = false,
    resolveDeviceId,
  }: {
    token: string;
    url?: string;
    debugMode?: boolean;
    resolveDeviceId: () => Promise<string>;
  }) {
    this.url = url;
    this.token = token;
    this.debugMode = debugMode;

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
    const url = new URL(this.url);
    if (this.debugMode) {
      url.searchParams.append('verbose', '1');
    }
    // url.searchParams.append('ip', '1');
    const payload = {
      event,
      properties: {
        ...this.baseProperties,
        time: Date.now() / 1000,
        $insert_id: crypto.randomUUID(),
        $device_id: this.deviceId,
        token: this.token,
        ...values,
      },
    };

    logTable(Loglevel.info, payload);

    return ky.post(this.url, { json: [payload] });
  }
}

const mixpanelApi = new MixpanelApi({
  token: mixPanelToken,
  resolveDeviceId: () => deviceIdStore.getSavedState(),
  debugMode: process.env.NODE_ENV !== 'production',
});

Object.assign(globalThis, { mixpanelApi });

mixpanelApi.setBaseProperties({
  origin: globalThis.location.origin,
  app_version: version,
});

export async function mixPanelTrack(
  account: Account,
  event: string,
  values: Record<string, unknown>
) {
  const baseParams = await getBaseMixpanelParams(account);
  const params = { ...baseParams, ...values };
  mixpanelApi.track(event, params);
}
