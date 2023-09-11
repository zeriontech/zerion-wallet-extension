import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Store } from 'store-unit';
import browser from 'webextension-polyfill';
import { ZerionAPI } from '../zerion-api/zerion-api';

type DappSecurityStatus = 'loading' | 'phishing' | 'ok' | 'unknown' | 'error';

interface State {
  whitelistedWebsites: string[];
  websiteStatus: Record<string, DappSecurityStatus>;
}

const initialState: State = {
  whitelistedWebsites: [],
  websiteStatus: {},
};

export class PhishingDefence extends Store<State> {
  private getSafeOrigin(url: string) {
    const safeUrl = url ? prepareForHref(url) : null;
    return safeUrl ? safeUrl.origin : null;
  }

  constructor() {
    super(initialState);
  }

  async blockOriginWithWarning({ params }: { params: { origin: string } }) {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab?.url && this.getSafeOrigin(tab.url) === params.origin) {
        const rawPopupUrl = browser.runtime.getManifest().action?.default_popup;
        if (!rawPopupUrl) {
          return;
        }
        const popupUrl = new URL(browser.runtime.getURL(rawPopupUrl));
        popupUrl.hash = `/phishing-warning?url=${params.origin}`;
        popupUrl.searchParams.append('templateType', 'tab');
        browser.tabs.update(tab.id, {
          url: popupUrl.toString(),
        });
      }
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

  async checkDapp(
    url?: string
  ): Promise<{ status: DappSecurityStatus; isWhitelisted: boolean }> {
    const origin = url ? this.getSafeOrigin(url) : null;
    if (!origin || !url) {
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
      ZerionAPI.securityCheckUrl({ url })
        .then((result) => {
          const status = result.data?.flags.isMalicious ? 'phishing' : 'ok';
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

  async getDappSecurityStatus({
    params,
  }: {
    params: { url?: string | null };
  }): Promise<{ status: DappSecurityStatus; isWhitelisted: boolean }> {
    const origin = params.url ? this.getSafeOrigin(params.url) : null;
    const result = {
      status: (origin && this.getState().websiteStatus[origin]) || 'unknown',
      isWhitelisted: origin
        ? this.getState().whitelistedWebsites.includes(origin)
        : false,
    };
    return Promise.resolve(result);
  }
}

export const phishingDefenceService = new PhishingDefence();
