import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const { describe } = extensionTest;

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

const CLEARINGHOUSE_STATE = {
  marginSummary: {
    accountValue: '12480.22',
    totalNtlPos: '18964.14',
    totalRawUsd: '12480.22',
    totalMarginUsed: '4778.79',
  },
  crossMarginSummary: {
    accountValue: '12480.22',
    totalNtlPos: '18964.14',
    totalRawUsd: '12480.22',
    totalMarginUsed: '4778.79',
  },
  withdrawable: '7701.43',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'BTC',
        szi: '0.12',
        entryPx: '94660',
        positionValue: '11569.44',
        leverage: { type: 'cross', value: 5 },
        marginUsed: '2313.89',
        unrealizedPnl: '210.18',
        returnOnEquity: '0.091',
        liquidationPx: '76890',
        maxLeverage: 40,
        cumFunding: { allTime: '0', sinceChange: '0', sinceOpen: '0' },
      },
    },
    {
      type: 'oneWay',
      position: {
        coin: 'ETH',
        szi: '-2.1',
        entryPx: '3570',
        positionValue: '7394.7',
        leverage: { type: 'cross', value: 3 },
        marginUsed: '2464.9',
        unrealizedPnl: '102.22',
        returnOnEquity: '0.041',
        liquidationPx: '4612.4',
        maxLeverage: 25,
        cumFunding: { allTime: '0', sinceChange: '0', sinceOpen: '0' },
      },
    },
  ],
  time: 0,
};

async function mockHyperliquid(page: Page) {
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
    switch (body?.type) {
      case 'perpDexs':
        await route.fulfill({ json: [] });
        return;
      case 'clearinghouseState':
        await route.fulfill({ json: CLEARINGHOUSE_STATE });
        return;
      case 'spotClearinghouseState':
        await route.fulfill({ json: { balances: [] } });
        return;
      case 'userAbstraction':
        await route.fulfill({ json: 'default' });
        return;
      case 'maxBuilderFee':
        await route.fulfill({ json: 0 });
        return;
      default:
        await route.fulfill({ json: null });
    }
  });
}

describe('Hyperliquid account card', () => {
  extensionTest(
    'shows equity, positions and PnL, then opens Zerion Perps',
    async ({ page, extensionPopupUrl }) => {
      await mockHyperliquid(page);
      await page.goto(`${extensionPopupUrl}#/overview`);

      const card = page.getByTestId('hyperliquid-account-card');
      await expect(card).toBeVisible({ timeout: 30_000 });
      await expect(card.getByText('$12,480.22')).toBeVisible();
      await expect(card.getByText('+$312.40 unrealized PnL')).toBeVisible();
      await expect(card.getByText('Long 5x')).toBeVisible();
      await expect(card.getByText('Short 3x')).toBeVisible();
      await expect(card.getByText('0.04% Zerion fee', { exact: false })).toBeVisible();

      await card.getByRole('button', { name: 'Manage in Zerion' }).click();
      await expect(page).toHaveURL(/.*\/overview\/perps/);
    },
  );

  extensionTest('Stay here hides the card', async ({ page, extensionPopupUrl }) => {
    await mockHyperliquid(page);
    await page.goto(`${extensionPopupUrl}#/overview`);

    const card = page.getByTestId('hyperliquid-account-card');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole('button', { name: 'Stay here' }).click();
    await expect(card).toHaveCount(0);
  });
});
