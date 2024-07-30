import browser from 'webextension-polyfill';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { InDappNotification } from 'src/shared/types/InDappNotification';
import type { Wallet } from 'src/shared/types/Wallet';
import { getNetworksStore } from 'src/modules/networks/networks-store.background';
import type { Chain } from 'src/modules/networks/Chain';
import { emitter } from './events';
import { INTERNAL_SYMBOL_CONTEXT } from './Wallet/Wallet';

export class InDappNotificationService {
  private readonly getWallet: () => Wallet;

  constructor({ getWallet }: { getWallet: () => Wallet }) {
    this.getWallet = getWallet;
  }

  async getTabIdsByOrigin(origin: string) {
    const tabs = await browser.tabs.query({});
    return tabs
      .filter((tab): tab is browser.Tabs.Tab & { id: number } =>
        Boolean(tab.url && tab.id && new URL(tab.url).origin === origin)
      )
      .map((tab) => tab.id);
  }

  async notify(origin: string, notification: InDappNotification) {
    const tabIds = await this.getTabIdsByOrigin(origin);
    for (const tabId of tabIds) {
      chrome.tabs.sendMessage(tabId, notification);
    }
  }

  async notifyChainChanged(chain: Chain, origin: string) {
    const preferences = await this.getWallet().getPreferences({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const networksStore = getNetworksStore(preferences);
    const networks = await networksStore.load({ chains: [chain.toString()] });
    const network = networks.getNetworkByName(chain);

    if (!network) {
      return;
    }

    await this.notify(origin, {
      notificationEvent: 'chainChanged',
      networkName: network.name,
      networkIcon: network.icon_url,
    });
  }

  async notifySwitchChainError(
    chainId: ChainId,
    origin: string,
    _error: unknown
  ) {
    await this.notify(origin, {
      notificationEvent: 'switchChainError',
      chainId: chainId.toString(),
    });
  }

  initialize() {
    emitter.on('chainChanged', this.notifyChainChanged.bind(this));
    emitter.on('switchChainError', this.notifySwitchChainError.bind(this));
  }
}
