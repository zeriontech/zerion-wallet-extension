import { prepareForHref } from 'src/ui/shared/prepareForHref';
import browser from 'webextension-polyfill';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { setUrlContext } from 'src/ui/shared/setUrlContext';
import { ZerionAPI } from '../zerion-api/zerion-api';

export type DappSecurityStatus =
  | 'loading'
  | 'phishing'
  | 'ok'
  | 'unknown'
  | 'error';

export class PhishingDefence {
  private whitelistedWebsites: Set<string> = new Set();
  private websiteStatus: Record<string, DappSecurityStatus> = {};

  private getSafeOrigin(url: string) {
    const safeUrl = url ? prepareForHref(url) : null;
    return safeUrl ? safeUrl.origin : null;
  }

  async blockOriginWithWarning(origin: string) {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab?.url && this.getSafeOrigin(tab.url) === origin) {
        const rawPopupUrl = browser.runtime.getManifest().action?.default_popup;
        if (!rawPopupUrl) {
          return;
        }
        const popupUrl = new URL(browser.runtime.getURL(rawPopupUrl));
        popupUrl.hash = `/phishing-warning?url=${origin}`;
        setUrlContext(popupUrl.searchParams, { windowType: 'tab' });
        browser.tabs.update(tab.id, { url: popupUrl.toString() });
      }
    }
  }

  async ignoreDappSecurityWarning(url: string) {
    const origin = this.getSafeOrigin(url);
    if (origin) {
      this.whitelistedWebsites.add(origin);
    }
  }

  async checkDapp(
    url?: string
  ): Promise<{ status: DappSecurityStatus; isWhitelisted: boolean }> {
    if (url === INTERNAL_ORIGIN) {
      return {
        status: 'ok',
        isWhitelisted: false,
      };
    }
    const origin = url ? this.getSafeOrigin(url) : null;
    if (!origin || !url) {
      return {
        status: 'unknown',
        isWhitelisted: false,
      };
    }

    const isWhitelisted = this.whitelistedWebsites.has(origin);
    const existingStatus = this.websiteStatus[origin] || 'unknown';

    if (isWhitelisted) {
      return {
        status: existingStatus,
        isWhitelisted,
      };
    }
    this.websiteStatus[origin] = 'loading';
    try {
      const result = await ZerionAPI.securityCheckUrl({ url });
      const status = result.data?.flags.isMalicious ? 'phishing' : 'ok';
      this.websiteStatus[origin] = status;
      return { status, isWhitelisted };
    } catch {
      this.websiteStatus[origin] = 'error';
      return { status: 'error', isWhitelisted };
    }
  }

  async getDappSecurityStatus(
    url?: string | null
  ): Promise<{ status: DappSecurityStatus; isWhitelisted: boolean }> {
    if (url === INTERNAL_ORIGIN) {
      return {
        status: 'ok',
        isWhitelisted: false,
      };
    }
    const origin = url ? this.getSafeOrigin(url) : null;
    const result = {
      status: (origin && this.websiteStatus[origin]) || 'unknown',
      isWhitelisted: origin ? this.whitelistedWebsites.has(origin) : false,
    };
    return result;
  }
}

export const phishingDefenceService = new PhishingDefence();
