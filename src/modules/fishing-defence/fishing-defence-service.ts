import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Store } from 'store-unit';
import browser from 'webextension-polyfill';
import { ZerionAPI } from '../zerion-api/zerion-api';

export type WebsiteStatus = 'loading' | 'fishing' | 'ok' | 'unknown' | 'error';

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

  async checkWebsite(
    url: string
  ): Promise<{ status: WebsiteStatus; isWhitelisted: boolean }> {
    const origin = this.getSafeOrigin(url);
    if (!origin) {
      return Promise.resolve({
        status: 'unknown',
        isWhitelisted: false,
      });
    }

    const isWhitelisted = this.getState().whitelistedWebsites.includes(origin);
    const existingStatus = this.getState().websiteStatus[origin] || 'unknown';

    if (isWhitelisted) {
      return Promise.resolve({
        status: existingStatus,
        isWhitelisted,
      });
    }
    this.setState((current) => ({
      ...current,
      websiteStatus: {
        ...current.websiteStatus,
        [origin]: 'loading',
      },
    }));
    return new Promise((resolve) => {
      // for debug purpose
      if (origin === 'https://app.zerion.io') {
        this.setState((current) => ({
          ...current,
          websiteStatus: {
            ...current.websiteStatus,
            [origin]: 'fishing',
          },
        }));
        return resolve({ status: 'fishing', isWhitelisted });
      }
      ZerionAPI.securityCheckUrl({ url })
        .then((result) => {
          const status = result.data?.flags.isMalicious ? 'fishing' : 'ok';
          this.setState((current) => ({
            ...current,
            websiteStatus: {
              ...current.websiteStatus,
              [origin]: status,
            },
          }));
          resolve({ status, isWhitelisted });
        })
        .catch(() => {
          this.setState((current) => ({
            ...current,
            websiteStatus: {
              ...current.websiteStatus,
              [origin]: 'error',
            },
          }));
          resolve({ status: 'error', isWhitelisted });
        });
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
