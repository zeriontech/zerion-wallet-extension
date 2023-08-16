import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Store } from 'store-unit';
import browser from 'webextension-polyfill';

type WebsiteStatus = 'loading' | 'fishing' | 'ok' | 'unknown';

interface State {
  whitelistedWebsites: string[];
  websiteStatus: Record<string, WebsiteStatus>;
}

const initialState: State = {
  whitelistedWebsites: [],
  websiteStatus: {},
};

export class FishingDefence extends Store<State> {
  private getSafeOrigin(url: string) {
    const safeUrl = url ? prepareForHref(url) : null;
    return safeUrl ? safeUrl.origin : null;
  }

  constructor() {
    super(initialState);
  }

  async openFishingWarning() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tab = tabs?.[0];
    if (tab) {
      const rawPopupUrl = browser.runtime.getManifest().action?.default_popup;
      if (!rawPopupUrl) {
        return;
      }
      const popupUrl = new URL(browser.runtime.getURL(rawPopupUrl));
      popupUrl.hash = `/fishing-warning?url=${tab.url}`;
      popupUrl.searchParams.append('templateType', 'tab');
      browser.tabs.update(tab.id, {
        url: popupUrl.toString(),
      });
    }
  }

  async allowWebsite({ params }: { params: { url: string } }) {
    const origin = this.getSafeOrigin(params.url);
    if (origin && !this.getState().whitelistedWebsites.includes(origin)) {
      this.setState((current) => ({
        ...current,
        whitelistedWebsites: [...current.whitelistedWebsites, origin],
      }));
    }
  }

  async checkWebsite(url: string) {
    const origin = this.getSafeOrigin(url);
    if (!origin || this.getState().whitelistedWebsites.includes(origin)) {
      return Promise.resolve(true);
    }
    this.setState((current) => ({
      ...current,
      websiteStatus: {
        ...current.websiteStatus,
        [origin]: 'loading',
      },
    }));
    return new Promise((resolve) => {
      if (origin === 'https://app.zerion.io') {
        setTimeout(() => {
          this.setState((current) => ({
            ...current,
            websiteStatus: {
              ...current.websiteStatus,
              [origin]: 'fishing',
            },
          }));
          resolve(false);
        }, 200);
      } else {
        this.setState((current) => ({
          ...current,
          websiteStatus: {
            ...current.websiteStatus,
            [origin]: 'ok',
          },
        }));
        return resolve(true);
      }
    });
  }

  async getWebsiteStatus({
    params,
  }: {
    params: { url: string };
  }): Promise<WebsiteStatus> {
    const origin = this.getSafeOrigin(params.url);
    const status = origin
      ? Promise.resolve(this.getState().websiteStatus[origin])
      : null;
    return status || 'unknown';
  }
}

export const fishingDefenceService = new FishingDefence();
