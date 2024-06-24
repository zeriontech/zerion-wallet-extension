import browser from 'webextension-polyfill';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { Chain } from 'src/modules/networks/Chain';
import type { InDappNotification } from 'src/shared/types/InDappNotification';
import { emitter } from './events';

async function getTabIdsByOrigin(origin: string) {
  const tabs = await browser.tabs.query({});
  return tabs
    .filter((tab): tab is browser.Tabs.Tab & { id: number } =>
      Boolean(tab.url && tab.id && new URL(tab.url).origin === origin)
    )
    .map((tab) => tab.id);
}

async function notify(origin: string, notification: InDappNotification) {
  const tabIds = await getTabIdsByOrigin(origin);
  tabIds.map((tabId) => chrome.tabs.sendMessage(tabId, notification));
}

async function notifyChainChanged(chain: Chain, origin: string) {
  const networks = await networksStore.load([chain.toString()]);
  const network = networks.getNetworkByName(chain);
  if (!network) {
    return;
  }

  await notify(origin, {
    notificationEvent: 'chainChanged',
    networkName: network.name,
    networkIcon: network.icon_url,
  });
}

async function notifySwitchChainError(chainId: ChainId, origin: string) {
  await notify(origin, {
    notificationEvent: 'switchChainError',
    chainId: chainId.toString(),
  });
}

export function initialize() {
  emitter.on('chainChanged', notifyChainChanged);
  emitter.on('switchChainError', notifySwitchChainError);
}
