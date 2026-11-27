import type { CookieLike } from './cookies';
import { buildCookieHeader } from './cookies';

/*
 * The chrome.d.ts enums are runtime objects; spelling the values keeps this
 * module importable in unit tests, where the chrome namespace does not exist.
 */
const MODIFY_HEADERS = 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType;
const SET_HEADER = 'set' as chrome.declarativeNetRequest.HeaderOperation;
const XMLHTTPREQUEST = 'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType;
const OTHER = 'other' as chrome.declarativeNetRequest.ResourceType;

/** `chrome.tabs.TAB_ID_NONE`: requests from the service worker and other non-tab contexts. */
export const TAB_ID_NONE = -1;

export const CLEARANCE_RULE_ID_BASE = 9100;

export interface ClearanceMirrorDeps {
  hosts: readonly string[];
  extensionId: string;
  /** All cookies for the host across every partition. */
  listCookies(host: string): Promise<readonly CookieLike[]>;
  updateSessionRules(options: chrome.declarativeNetRequest.UpdateRuleOptions): Promise<void>;
  now?(): number;
}

function createRule(
  id: number,
  host: string,
  extensionId: string,
  cookieHeader: string,
): chrome.declarativeNetRequest.Rule {
  return {
    id,
    priority: 1,
    action: {
      type: MODIFY_HEADERS,
      requestHeaders: [
        {
          header: 'Cookie',
          operation: SET_HEADER,
          value: cookieHeader,
        },
      ],
    },
    condition: {
      // Restrict to the extension's own non-tab requests. Web pages, including
      // app.zerion.io, must never receive a header set by this rule.
      requestDomains: [host],
      initiatorDomains: [extensionId],
      tabIds: [TAB_ID_NONE],
      resourceTypes: [XMLHTTPREQUEST, OTHER],
    },
  };
}

/**
 * Mirrors the ZPI cookies into DNR session rules, one rule per API host.
 *
 * Session rules survive service-worker restarts but not a browser restart, so
 * `refresh()` runs on startup and on every relevant cookie change.
 */
export class ClearanceCookieMirror {
  private lastSignature: string | null = null;

  constructor(private readonly deps: ClearanceMirrorDeps) {}

  async refresh(): Promise<{ hasClearance: boolean }> {
    const now = this.deps.now?.() ?? Date.now();
    const cookiesByHost = await Promise.all(
      this.deps.hosts.map((host) => this.deps.listCookies(host)),
    );

    const rules: chrome.declarativeNetRequest.Rule[] = [];
    let hasClearance = false;
    this.deps.hosts.forEach((host, index) => {
      const cookieHeader = buildCookieHeader(cookiesByHost[index], host, now);
      if (!cookieHeader) {
        return;
      }
      hasClearance = true;
      rules.push(
        createRule(CLEARANCE_RULE_ID_BASE + index, host, this.deps.extensionId, cookieHeader),
      );
    });

    const signature = JSON.stringify(rules);
    if (signature !== this.lastSignature) {
      await this.deps.updateSessionRules({
        removeRuleIds: this.deps.hosts.map((_, index) => CLEARANCE_RULE_ID_BASE + index),
        addRules: rules,
      });
      this.lastSignature = signature;
    }
    return { hasClearance };
  }
}
