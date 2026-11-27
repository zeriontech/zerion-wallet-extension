import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const { describe } = extensionTest;

const POSITIONS = {
  data: [
    {
      id: 'usdc-base',
      amount: { currency: 'usd', quantity: '2410.55', value: 2410.55, usdValue: 2410.55 },
      fungible: {
        id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        symbol: 'USDC',
        name: 'USD Coin',
        iconUrl: 'https://example.com/usdc.png',
        meta: { price: 1 },
      },
      chain: { id: 'base', name: 'Base', iconUrl: '' },
    },
    {
      id: 'eth-ethereum',
      amount: { currency: 'usd', quantity: '1.5', value: 5120.8, usdValue: 5120.8 },
      fungible: {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ether',
        iconUrl: 'https://example.com/eth.png',
        meta: { price: 3413.87 },
      },
      chain: { id: 'ethereum', name: 'Ethereum', iconUrl: '' },
    },
  ],
  meta: null,
  errors: null,
};

const QUOTE = {
  contractMetadata: {
    id: 'test-bridge',
    name: 'Test Bridge',
    iconUrl: '',
    explorer: null,
  },
  outputAmount: { currency: 'usdc', quantity: '999.2', value: 999.2, usdValue: 999.2 },
  outputAmountAfterFees: { currency: 'usdc', quantity: '999.2', value: 999.2, usdValue: 999.2 },
  minimumOutputAmount: { currency: 'usdc', quantity: '997', value: 997, usdValue: 997 },
  error: null,
  protocolFee: {
    basePercentage: 0,
    percentage: 0,
    fungible: null,
    amount: { currency: 'usdc', quantity: '0.5', value: 0.5, usdValue: 0.5 },
  },
  bridgeFee: {
    fungible: null,
    amount: { currency: 'usdc', quantity: '1.2', value: 1.2, usdValue: 1.2 },
  },
  rate: [],
  networkFee: {
    free: false,
    amount: { currency: 'usd', quantity: '0.8', value: 0.8, usdValue: 0.8 },
    fungible: null,
  },
  transactionApprove: null,
  transactionSwap: {
    evm: {
      type: '0x2',
      from: '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1',
      to: '0x00000000000000000000000000000000000000aa',
      nonce: '0x1',
      chainId: '0x2105',
      gas: '0x1',
      gasPrice: null,
      maxFee: '0x1',
      maxPriorityFee: '0x1',
      value: '0x0',
      data: '0x',
      customData: null,
    },
    solana: null,
  },
  intentSwap: null,
  intentApprove: null,
  quoteId: 'quote-1',
  autoSlippage: null,
  finalSlippage: null,
};

async function mockFunding(target: Page | BrowserContext) {
  const cors = { 'access-control-allow-origin': '*' };
  await target.route('**/wallet/get-simple-positions/v1*', (route) =>
    route.fulfill({ json: POSITIONS, headers: cors }),
  );
  await target.route('**/transaction/stream-swap-quotes/v3*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: cors,
      body: `event: update\ndata: ${JSON.stringify([QUOTE])}\n\n`,
    }),
  );
}

describe('Hyperliquid funding sheet', () => {
  extensionTest(
    'ranks balances, shows actual fees and opens the deposit route',
    async ({ page, extensionPopupUrl }) => {
      await mockFunding(page);
      await page.goto(`${extensionPopupUrl}#/hyperliquid/fund`);

      await expect(page.getByText('Fund your Hyperliquid account')).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText('Base')).toBeVisible();
      await expect(page.getByText('Ethereum')).toBeVisible();
      await page.getByRole('textbox').fill('1000');

      await expect(page.getByText('Test Bridge')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Network fee')).toBeVisible();
      await expect(page.getByText('Bridge fee')).toBeVisible();
      await expect(page.getByText('$0.80')).toBeVisible();
      await expect(page.getByText('$1.20')).toBeVisible();
      await expect(page.getByText('Total fees')).toBeVisible();
      await expect(page.getByText('$2.50')).toBeVisible();

      await page.getByRole('button', { name: /^Deposit/ }).click();
      await expect(page).toHaveURL(/.*\/perps\/deposit\?.*inputChain=ethereum.*/);

      await page.getByRole('button', { name: 'Dismiss onboarding' }).click();
      await expect(page.getByText('Test Bridge')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Network fee')).toBeVisible();
      await expect(page.getByText('Bridge fee')).toBeVisible();
      await expect(page.getByText('$2.50')).toBeVisible();
    },
  );

  extensionTest(
    'opens after Enable trading only when nothing is withdrawable',
    async ({ page, context, extensionPopupUrl }) => {
      await mockFunding(context);
      await context.route('https://api.hyperliquid.xyz/info', async (route) => {
        const body = route.request().postDataJSON() as { type?: string } | null;
        if (body?.type === 'clearinghouseState') {
          await route.fulfill({
            json: {
              marginSummary: {
                accountValue: '0',
                totalNtlPos: '0',
                totalRawUsd: '0',
                totalMarginUsed: '0',
              },
              crossMarginSummary: {
                accountValue: '0',
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

      const typedData = {
        domain: {
          name: 'HyperliquidSignTransaction',
          version: '1',
          chainId: 42161,
          verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        types: {
          EIP712Domain: [],
          'HyperliquidTransaction:ApproveAgent': [],
        },
        primaryType: 'HyperliquidTransaction:ApproveAgent',
        message: {
          hyperliquidChain: 'Mainnet',
          agentAddress: '0x1111111111111111111111111111111111111111',
          agentName: 'web',
          nonce: 1767225600000,
        },
      };
      const params = new URLSearchParams({
        origin: 'https://app.hyperliquid.xyz',
        typedDataRaw: JSON.stringify(typedData),
        method: 'eth_signTypedData_v4',
        windowId: 'e2e-enable-trading',
      });
      await page.goto(`${extensionPopupUrl}#/signTypedData?${params.toString()}`);

      const fundingWindowPromise = context.waitForEvent('page', { timeout: 30_000 });
      await page.getByRole('button', { name: /^Sign$/ }).click();
      const fundingPage = await fundingWindowPromise;

      expect(fundingPage.url()).toContain('/hyperliquid/fund');
      await expect(fundingPage.getByText('Fund your Hyperliquid account')).toBeVisible({
        timeout: 30_000,
      });
      await expect(fundingPage.getByText('USDC', { exact: true }).first()).toBeVisible();
    },
  );
});
