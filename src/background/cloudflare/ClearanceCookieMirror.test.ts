import { describe, expect, it, vi } from 'vite-plus/test';
import type { CookieLike } from './cookies';
import { CLEARANCE_RULE_ID_BASE, ClearanceCookieMirror } from './ClearanceCookieMirror';

const NOW = Date.UTC(2026, 0, 1, 12);

function cookie(overrides: Partial<CookieLike>): CookieLike {
  return {
    name: 'cf_clearance',
    value: 'value',
    domain: 'zpi.zerion.io',
    path: '/',
    creationDate: 100,
    ...overrides,
  };
}

function setup(initialCookies: Record<string, CookieLike[]>) {
  const cookies = { ...initialCookies };
  const rules: chrome.declarativeNetRequest.Rule[] = [];
  const updateSessionRules = vi.fn(
    async (options: chrome.declarativeNetRequest.UpdateRuleOptions) => {
      const remove = new Set(options.removeRuleIds ?? []);
      for (let index = rules.length - 1; index >= 0; index -= 1) {
        if (remove.has(rules[index].id)) rules.splice(index, 1);
      }
      rules.push(...(options.addRules ?? []));
    },
  );
  const mirror = new ClearanceCookieMirror({
    hosts: ['zpi.zerion.io', 'zpi-testnet.zerion.io'],
    extensionId: 'extension-id',
    listCookies: async (host) => cookies[host] ?? [],
    updateSessionRules,
    now: () => NOW,
  });
  return { mirror, rules, updateSessionRules, cookies };
}

describe('ClearanceCookieMirror', () => {
  it('adds a Cookie header rule restricted to the extension service worker', async () => {
    const { mirror, rules } = setup({
      'zpi.zerion.io': [
        cookie({ value: 'clearance' }),
        cookie({ value: 'session', name: 'session_id', domain: '.zerion.io' }),
      ],
    });

    await expect(mirror.refresh()).resolves.toEqual({ hasClearance: true });

    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      id: CLEARANCE_RULE_ID_BASE,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {
            header: 'Cookie',
            operation: 'set',
            value: 'cf_clearance=clearance; session_id=session',
          },
        ],
      },
      condition: {
        requestDomains: ['zpi.zerion.io'],
        initiatorDomains: ['extension-id'],
        tabIds: [-1],
        resourceTypes: ['xmlhttprequest', 'other'],
      },
    });
  });

  it('updates the rule when the cookie changes and removes it when the cookie is deleted', async () => {
    const { mirror, cookies, updateSessionRules, rules } = setup({
      'zpi.zerion.io': [cookie({ value: 'old' })],
    });
    await mirror.refresh();
    expect(rules[0].action.requestHeaders?.[0].value).toBe('cf_clearance=old');

    cookies['zpi.zerion.io'] = [cookie({ value: 'new', creationDate: 200 })];
    await mirror.refresh();
    expect(updateSessionRules).toHaveBeenCalledTimes(2);
    expect(rules[0].action.requestHeaders?.[0].value).toBe('cf_clearance=new');

    cookies['zpi.zerion.io'] = [];
    await mirror.refresh();
    expect(updateSessionRules).toHaveBeenCalledTimes(3);
    expect(rules).toHaveLength(0);
  });

  it('does not rewrite rules when the cookie snapshot did not change', async () => {
    const { mirror, updateSessionRules } = setup({
      'zpi.zerion.io': [cookie({ value: 'same' })],
    });
    await mirror.refresh();
    await mirror.refresh();
    expect(updateSessionRules).toHaveBeenCalledTimes(1);
  });

  it('creates one rule per host with its own clearance', async () => {
    const { mirror, rules } = setup({
      'zpi.zerion.io': [cookie({ value: 'mainnet' })],
      'zpi-testnet.zerion.io': [cookie({ value: 'testnet', domain: 'zpi-testnet.zerion.io' })],
    });
    await mirror.refresh();
    expect(rules.map((rule) => rule.id)).toEqual([
      CLEARANCE_RULE_ID_BASE,
      CLEARANCE_RULE_ID_BASE + 1,
    ]);
    expect(rules[1].action.requestHeaders?.[0].value).toBe('cf_clearance=testnet');
  });
});
