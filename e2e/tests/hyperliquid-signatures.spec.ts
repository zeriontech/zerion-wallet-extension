import { expect } from '@playwright/test';
import { createExtensionTest } from './test';
import type { ExtensionPopupUrl } from './test';

const extensionTest = createExtensionTest();
const { describe } = extensionTest;

function signTypedDataUrl({
  extensionPopupUrl,
  typedData,
  origin,
}: {
  extensionPopupUrl: ExtensionPopupUrl;
  typedData: Record<string, unknown>;
  origin: string;
}) {
  const params = new URLSearchParams({
    origin,
    typedDataRaw: JSON.stringify(typedData),
    method: 'eth_signTypedData_v4',
    windowId: 'e2e-sign-typed-data',
  });
  return `${extensionPopupUrl}#/signTypedData?${params.toString()}`;
}

function hyperliquidTypedData(
  primaryType: string,
  message: Record<string, unknown>,
): Record<string, unknown> {
  return {
    domain: {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: 42161,
      verifyingContract: '0x0000000000000000000000000000000000000000',
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      [`HyperliquidTransaction:${primaryType}`]: [],
    },
    primaryType: `HyperliquidTransaction:${primaryType}`,
    message,
  };
}

describe('Hyperliquid signatures', () => {
  extensionTest(
    'blocks a non-zero builder-fee approval on the official origin',
    async ({ page, extensionPopupUrl }) => {
      await page.route('https://api.hyperliquid.xyz/info', (route) => route.fulfill({ json: 0 }));
      await page.goto(
        signTypedDataUrl({
          extensionPopupUrl,
          origin: 'https://app.hyperliquid.xyz',
          typedData: hyperliquidTypedData('ApproveBuilderFee', {
            hyperliquidChain: 'Mainnet',
            maxFeeRate: '0.1%',
            builder: '0x7a1e00000000000000000000000000000000c3f0',
            nonce: 1767225600000,
          }),
        }),
      );

      await expect(page.getByText('Extra fee blocked')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('0.1% of every trade')).toBeVisible();
      await expect(page.getByText('Unknown (0x7a1e…c3f0)', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Sign$/ })).toHaveCount(0);
      // The raw payload is still available: readable summaries do not mask it.
      await page.getByRole('button', { name: /Data/ }).click();
      await expect(page.getByText('Copy Raw Data')).toBeVisible();
      await expect(page.locator('dialog[open]').getByText(/"maxFeeRate"/)).toBeVisible();
    },
  );

  extensionTest('shows a malformed fee as blocked', async ({ page, extensionPopupUrl }) => {
    await page.route('https://api.hyperliquid.xyz/info', (route) => route.fulfill({ json: 0 }));
    await page.goto(
      signTypedDataUrl({
        extensionPopupUrl,
        origin: 'https://app.hyperliquid.xyz',
        typedData: hyperliquidTypedData('ApproveBuilderFee', {
          builder: '0x7a1e00000000000000000000000000000000c3f0',
          maxFeeRate: 'not-a-fee',
        }),
      }),
    );

    await expect(page.getByText('Extra fee blocked')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/treated as a fee/)).toBeVisible();
  });

  extensionTest(
    'renders Enable trading in plain words and keeps the payload',
    async ({ page, extensionPopupUrl }) => {
      await page.route('https://api.hyperliquid.xyz/info', (route) => route.fulfill({ json: 0 }));
      await page.goto(
        signTypedDataUrl({
          extensionPopupUrl,
          origin: 'https://app.hyperliquid.xyz',
          typedData: hyperliquidTypedData('ApproveAgent', {
            hyperliquidChain: 'Mainnet',
            agentAddress: '0x1111111111111111111111111111111111111111',
            agentName: 'web',
            nonce: 1767225600000,
          }),
        }),
      );

      await expect(page.getByText('Enable trading').first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('Trading agent')).toBeVisible();
      await expect(page.getByText(/cannot withdraw funds/i)).toBeVisible();
      await page.getByRole('button', { name: /Data/ }).click();
      await expect(page.locator('dialog[open]').getByText(/"agentAddress"/)).toBeVisible();
    },
  );
});
