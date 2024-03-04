import ky from 'ky';
import mixpanel from 'mixpanel-browser';
import type { Account } from 'src/background/account/Account';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { PersistentStore } from 'src/modules/persistent-store';
import { version } from 'src/shared/packageVersion';
import { getAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { invariant } from '../invariant';
import { Loglevel, logTable } from '../logger';

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
    url.searchParams.append('ip', '1');
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

mixpanel.init(mixPanelToken, { debug: true });
Object.assign(globalThis, { mixpanel });

mixpanelApi.setBaseProperties({
  origin: globalThis.location.origin,
  app_version: version,
});

mixpanel.register({
  origin: globalThis.location.origin,
  app_version: version,
});

async function getFundedWalletsCount({ addresses }: { addresses: string[] }) {
  // TODO: cache results and periodically make new checks only for non-funded addresses
  // const toCheck = addresses.filter()
  const result = await getAddressActivity({ addresses });
  console.log({ result });
  if (!result) {
    return 0;
  }
  return Object.values(result).reduce(
    (sum, value) => sum + (value.active ? 1 : 0),
    0
  );
}

async function getBaseMixpanelParams(account: Account) {
  const getUserId = () => account.getUser()?.id;
  const apiLayer = account.getCurrentWallet();
  const groups = await apiLayer.uiGetWalletGroups({
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  const addresses = groups?.flatMap((group) =>
    group.walletContainer.wallets.map((wallet) => wallet.address)
  );
  const walletsCount =
    groups?.reduce(
      (sum, group) => sum + group.walletContainer.wallets.length,
      0
    ) ?? 0;
  const userId = getUserId();
  return {
    $user_id: userId,
    num_favourite_tokens: 0,
    user_id: userId,

    num_wallets: walletsCount,
    num_watch_list_wallets: 0,
    num_watch_list_wallets_with_provider: 0,
    num_my_wallets: walletsCount,
    num_my_wallets_with_provider: walletsCount,
    num_wallets_with_provider: walletsCount,
    num_funded_wallets_with_provider: addresses
      ? await getFundedWalletsCount({
          addresses,
        })
      : 0,
    num_zerion_wallets: walletsCount,
    num_connected_wallets: 0,
    num_wallet_groups: groups?.length ?? 0,
    currency: 'usd',
    language: 'en',
    // total_balance,
  };
}

export async function mixPanelTrack(
  account: Account,
  event: string,
  values: Record<string, unknown>
) {
  const baseParams = await getBaseMixpanelParams(account);
  console.log({ baseParams });
  mixpanel.track(event, { ...baseParams, ...values });
  mixpanelApi.track(event, { ...baseParams, ...values });
}
