import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createExtensionTest } from './test';
import type { ExtensionPopupUrl } from './test';

const extensionTest = createExtensionTest();
const { describe } = extensionTest;

const HYPERLIQUID_ORIGIN = 'https://app.hyperliquid.xyz';

const PERPS_CONFIG = {
  builderAddress: '0x00000000000000000000000000000000000000aa',
  builderFee: 40,
  builderFeePremium: 20,
  referralCode: 'ZERIONAPP',
  maxApproveBuilderFee: '0.1%',
  maxApproveBuilderFeeInteger: 100,
  withdrawalFeeUsd: 1,
  minimumPositionSizeUsd: 10,
  supportedCollateralTokens: [0],
  supportedDexes: [],
  tokenizedAssetDexes: [],
};

function requestAccountsUrl(extensionPopupUrl: ExtensionPopupUrl) {
  const params = new URLSearchParams({
    origin: HYPERLIQUID_ORIGIN,
    windowId: 'e2e-request-accounts',
    ecosystem: 'evm',
  });
  return `${extensionPopupUrl}#/requestAccounts?${params.toString()}`;
}

async function mockHyperliquid({
  page,
  referredBy = null,
  accountValue = '250',
}: {
  page: Page;
  referredBy?: null | { referrer: string; code: string };
  accountValue?: string;
}) {
  const exchangeRequests: unknown[] = [];
  await page.route('https://proxy.zerion.io/remote-config**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('key') === 'hyperliquid_perps_config') {
      await route.fulfill({ json: { hyperliquid_perps_config: PERPS_CONFIG } });
      return;
    }
    await route.continue();
  });
  await page.route('https://api.hyperliquid.xyz/info', async (route) => {
    const body = route.request().postDataJSON() as { type?: string } | null;
    if (body?.type === 'referral') {
      await route.fulfill({ json: { referredBy } });
      return;
    }
    if (body?.type === 'clearinghouseState') {
      await route.fulfill({
        json: {
          marginSummary: {
            accountValue,
            totalNtlPos: '0',
            totalRawUsd: '0',
            totalMarginUsed: '0',
          },
          crossMarginSummary: {
            accountValue,
            totalNtlPos: '0',
            totalRawUsd: '0',
            totalMarginUsed: '0',
          },
          withdrawable: '0',
          assetPositions: [],
          time: 0,
        },
      });
      return;
    }
    await route.fulfill({ json: null });
  });
  await page.route('https://api.hyperliquid.xyz/exchange', async (route) => {
    exchangeRequests.push(route.request().postDataJSON());
    await route.fulfill({ json: { status: 'ok', response: { type: 'default' } } });
  });
  return { exchangeRequests };
}

describe('Hyperliquid referral prompt', () => {
  extensionTest(
    'offers the runtime code with disclosure and applies it',
    async ({ page, extensionPopupUrl }) => {
      const { exchangeRequests } = await mockHyperliquid({ page });
      await page.goto(requestAccountsUrl(extensionPopupUrl));
      await page.getByRole('button', { name: /^Connect$/ }).click();

      await expect(page.getByText('Save 4% on Hyperliquid fees')).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText('Zerion earns')).toBeVisible();
      await expect(page.getByText('10% of your fees, paid by Hyperliquid')).toBeVisible();
      await expect(page.getByText('One message, no funds move')).toBeVisible();
      await expect(page.getByText(/can't be changed later/i)).toBeVisible();

      await page.getByRole('button', { name: /Apply code/i }).click();
      await expect(page.getByText('Referral code applied')).toBeVisible({ timeout: 30_000 });

      expect(exchangeRequests).toHaveLength(1);
      expect(exchangeRequests[0]).toMatchObject({
        action: { type: 'setReferrer', code: 'ZERIONAPP' },
      });
    },
  );

  extensionTest(
    'does not offer the prompt to an account with a referrer',
    async ({ page, extensionPopupUrl }) => {
      await mockHyperliquid({
        page,
        referredBy: { referrer: '0x00000000000000000000000000000000000000bb', code: 'OTHER' },
      });
      await page.goto(requestAccountsUrl(extensionPopupUrl));
      await page.getByRole('button', { name: /^Connect$/ }).click();

      // The connection resolves without showing the offer.
      await expect(page.getByRole('button', { name: /^Connect$/ })).toBeEnabled({
        timeout: 30_000,
      });
      await expect(page.getByText('Save 4% on Hyperliquid fees')).toHaveCount(0);
    },
  );

  extensionTest(
    'does not offer the prompt to an unfunded account',
    async ({ page, extensionPopupUrl }) => {
      await mockHyperliquid({ page, accountValue: '0' });
      await page.goto(requestAccountsUrl(extensionPopupUrl));
      await page.getByRole('button', { name: /^Connect$/ }).click();

      await expect(page.getByRole('button', { name: /^Connect$/ })).toBeEnabled({
        timeout: 30_000,
      });
      await expect(page.getByText('Save 4% on Hyperliquid fees')).toHaveCount(0);
    },
  );
});
