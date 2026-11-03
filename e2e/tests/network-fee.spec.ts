import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { testWallets } from 'e2e/fixtures/constants';
import { createExtensionTest } from './test';

const test = createExtensionTest({ headless: true });

const AVERAGE_INDICATOR = 'Average fee selected (your last choice)';
const CUSTOM_INDICATOR = 'Custom fee selected (kept for 1 hour)';

function sendTransactionUrl(extensionPopupUrl: string, nonce: string) {
  const transaction = {
    from: testWallets.alice.address,
    to: '0xea79c0adb4f9d249770a8752fc6c0020999c52a0',
    chainId: '0x1',
    value: '0x0',
    data: '0x',
    gas: '0x5208',
    nonce,
    maxFeePerGas: '0x6fc23ac00',
    maxPriorityFeePerGas: '0x3b9aca00',
  };
  const params = new URLSearchParams({
    origin: 'https://app.zerion.io',
    transaction: JSON.stringify(transaction),
    windowId: '1',
  });
  return `${extensionPopupUrl}#/sendTransaction?${params}`;
}

async function openTransaction(
  page: Page,
  extensionPopupUrl: string,
  nonce: string
) {
  await page.goto(sendTransactionUrl(extensionPopupUrl, nonce));
  // Force a real reload: changing only the hash is a same-document navigation
  // and would keep the previous form configuration in memory.
  await page.reload();
  await expect(
    page.getByRole('button', { name: /^(~\d+ sec|Custom)/ }).first()
  ).toBeVisible({ timeout: 30_000 });
}

async function openFeeDialog(page: Page) {
  const feeRow = page
    .getByRole('button', { name: /^(~\d+ sec|Custom)/ })
    .first();
  await expect(feeRow).toBeEnabled();
  await feeRow.click();
  await expect(
    page.getByRole('button', { name: /Fast/ }).first()
  ).toBeVisible();
}

test('remembers the fee level per chain and flags non-Fast levels', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await page.setViewportSize({ width: 400, height: 640 });
  await context.route('**/chain/get-gas-prices/v1*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          average: {
            classic: null,
            eip1559: {
              maxFee: 20_000_000_000,
              priorityFee: 1_000_000_000,
              baseFee: 15_000_000_000,
            },
            optimistic: null,
            eta: 60,
          },
          fast: {
            classic: null,
            eip1559: {
              maxFee: 30_000_000_000,
              priorityFee: 2_000_000_000,
              baseFee: 15_000_000_000,
            },
            optimistic: null,
            eta: 15,
          },
        },
        errors: null,
        meta: null,
      }),
    });
  });

  await openTransaction(page, extensionPopupUrl, '0x1');
  await expect(page.getByText(AVERAGE_INDICATOR)).toHaveCount(0);

  // Pick Average: the indicator appears immediately.
  await openFeeDialog(page);
  await page
    .getByRole('button', { name: /Average/ })
    .first()
    .click();
  await expect(page.getByText(AVERAGE_INDICATOR)).toBeVisible();

  // The next transaction on the same chain starts on Average.
  await openTransaction(page, extensionPopupUrl, '0x2');
  await expect(page.getByText(AVERAGE_INDICATOR)).toBeVisible();

  // Picking Fast clears the indicator and persists.
  await openFeeDialog(page);
  await page.getByRole('button', { name: /Fast/ }).first().click();
  await expect(page.getByText(AVERAGE_INDICATOR)).toHaveCount(0);
  await openTransaction(page, extensionPopupUrl, '0x3');
  await expect(page.getByText(AVERAGE_INDICATOR)).toHaveCount(0);

  // Custom is saved for the chain and reused by the next transaction.
  await openFeeDialog(page);
  await page
    .getByRole('button', { name: /Custom/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  // The legacy dapp dialog returns to its selector after saving Custom.
  await page.keyboard.press('Escape');
  await expect(page.getByText(CUSTOM_INDICATOR)).toBeVisible();
  await openTransaction(page, extensionPopupUrl, '0x4');
  await expect(page.getByText(CUSTOM_INDICATOR)).toBeVisible();

  // Fast clears the saved Custom entry too.
  await openFeeDialog(page);
  await page.getByRole('button', { name: /Fast/ }).first().click();
  await expect(page.getByText(CUSTOM_INDICATOR)).toHaveCount(0);
});
