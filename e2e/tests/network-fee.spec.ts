import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { testWallets } from 'e2e/fixtures/constants';
import { createExtensionTest } from './test';

const test = createExtensionTest({ headless: true });

const SLOW_REMINDER = 'Slow selected';
const CUSTOM_REMINDER = 'Custom fee selected';
const SWITCH_TO_FAST = 'Switch to Fast';

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

function sendFormUrl(extensionPopupUrl: string) {
  const params = new URLSearchParams({
    inputChain: 'ethereum',
    inputFungibleId: 'eth',
    inputAmount: '0.001',
    to: '0xea79c0adb4f9d249770a8752fc6c0020999c52a0',
  });
  return `${extensionPopupUrl}#/send-form?${params}`;
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
    page.getByRole('button', { name: 'Network Fee' }).first()
  ).toBeVisible({ timeout: 30_000 });
}

async function openFeeDialog(page: Page) {
  const feeRow = page.getByRole('button', { name: 'Network Fee' }).first();
  await expect(feeRow).toBeEnabled();
  await feeRow.click();
  await expect(
    page.getByRole('button', { name: /Fast icon/ }).first()
  ).toBeVisible();
}

async function feeAmount(locator: Locator) {
  const text = (await locator.textContent()) ?? '';
  const match = text.match(/\$[\d.,]+/);
  expect(match, `No amount in "${text}"`).not.toBeNull();
  return match?.[0];
}

function parseFeeText(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/(\$[\d.,]+|\d[\d.,]*\s*[A-Za-z]{2,})$/);
  expect(match, `No fee text in "${trimmed}"`).not.toBeNull();
  return match![0].trim();
}

async function feeText(locator: Locator) {
  return parseFeeText((await locator.textContent()) ?? '');
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

  let sendFeeValue: number | null = 3;
  await context.route('**/transaction/get-send/v1*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          inputAmount: {
            currency: 'usd',
            quantity: '0.001',
            value: 2.26,
            usdValue: 2.26,
          },
          error: null,
          networkFee: {
            free: false,
            amount: {
              quantity: '0.0001',
              value: sendFeeValue,
              usdValue: sendFeeValue,
            },
            fungible: null,
          },
          transactionSend: {
            evm: {
              type: '0x2',
              from: testWallets.alice.address,
              to: '0xea79c0adb4f9d249770a8752fc6c0020999c52a0',
              nonce: '0x0',
              chainId: '0x1',
              gas: '0x5208',
              gasPrice: null,
              maxFee: '0x6fc23ac00',
              maxPriorityFee: '0x77359400',
              value: '0x38d7ea4c68000',
              data: '0x',
              customData: null,
            },
            solana: null,
          },
        },
        meta: null,
        errors: null,
      }),
    });
  });

  await openTransaction(page, extensionPopupUrl, '0x1');
  await expect(page.getByText(SLOW_REMINDER)).toHaveCount(0);
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWITCH_TO_FAST })).toHaveCount(
    0
  );

  // Pick Slow: the reminder and the one-tap switch appear immediately.
  await openFeeDialog(page);
  await expect(page.getByRole('button', { name: /Fast icon/ })).toContainText(
    '~15 sec'
  );
  await expect(page.getByRole('button', { name: /Slow icon/ })).toContainText(
    '~60 sec'
  );
  await expect(page.getByRole('button', { name: /Custom icon/ })).toContainText(
    /\$/
  );
  await expect(page.getByText('Average')).toHaveCount(0);
  await page.getByRole('button', { name: /Slow icon/ }).click();
  await expect(page.getByText(SLOW_REMINDER)).toBeVisible();
  await expect(
    page.getByRole('button', { name: SWITCH_TO_FAST })
  ).toBeVisible();

  // The row amount equals the highlighted Slow row in the picker.
  await openFeeDialog(page);
  const slowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(slowPicker).toHaveAttribute('aria-pressed', 'true');
  const slowPickerAmount = await feeAmount(slowPicker);
  await page.keyboard.press('Escape');
  const slowRowAmount = await feeAmount(
    page.getByRole('button', { name: 'Network Fee' }).first()
  );
  expect(slowRowAmount).toBe(slowPickerAmount);

  // The next transaction on the same chain starts on Slow.
  await openTransaction(page, extensionPopupUrl, '0x2');
  await expect(page.getByText(SLOW_REMINDER)).toBeVisible();

  // The reminder's switch persists Fast through the same path as the picker.
  await page.getByRole('button', { name: SWITCH_TO_FAST }).click();
  await expect(page.getByText(SLOW_REMINDER)).toHaveCount(0);
  await openFeeDialog(page);
  const fastPicker = page.getByRole('button', { name: /Fast icon/ });
  await expect(fastPicker).toHaveAttribute('aria-pressed', 'true');
  const fastPickerAmount = await feeAmount(fastPicker);
  await page.keyboard.press('Escape');
  const fastRowAmount = await feeAmount(
    page.getByRole('button', { name: 'Network Fee' }).first()
  );
  expect(fastRowAmount).toBe(fastPickerAmount);
  await openTransaction(page, extensionPopupUrl, '0x3');
  await expect(page.getByText(SLOW_REMINDER)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWITCH_TO_FAST })).toHaveCount(
    0
  );

  // Custom is saved for the chain, priced in the picker, and reused.
  await openFeeDialog(page);
  await page.getByRole('button', { name: /Custom icon/ }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  // The legacy dapp dialog returns to its selector after saving Custom.
  const customPicker = page.getByRole('button', { name: /Custom icon/ });
  await expect(customPicker).toHaveAttribute('aria-pressed', 'true');
  const customPickerAmount = await feeAmount(customPicker);
  await page.keyboard.press('Escape');
  await expect(page.getByText(CUSTOM_REMINDER)).toBeVisible();
  const customRowAmount = await feeAmount(
    page.getByRole('button', { name: 'Network Fee' }).first()
  );
  expect(customRowAmount).toBe(customPickerAmount);

  await openTransaction(page, extensionPopupUrl, '0x4');
  await expect(page.getByText(CUSTOM_REMINDER)).toBeVisible();

  // Fast clears the saved Custom entry too.
  await page.getByRole('button', { name: SWITCH_TO_FAST }).click();
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);
  await openTransaction(page, extensionPopupUrl, '0x5');
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWITCH_TO_FAST })).toHaveCount(
    0
  );

  // Send: the row and the highlighted picker row use the same amount,
  // including the Custom gas limit.
  await page.goto(sendFormUrl(extensionPopupUrl));
  const sendFeeRow = page
    .getByRole('button')
    .filter({ hasText: 'Network Fee' })
    .first();
  await expect(sendFeeRow).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(SLOW_REMINDER)).toHaveCount(0);

  await sendFeeRow.click();
  await page.getByRole('button', { name: /Slow icon/ }).click();
  await expect(page.getByText(SLOW_REMINDER)).toBeVisible();
  await sendFeeRow.click();
  const sendSlowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(sendSlowPicker).toHaveAttribute('aria-pressed', 'true');
  const sendSlowPickerAmount = await feeAmount(sendSlowPicker);
  await page.keyboard.press('Escape');
  await expect(sendFeeRow).toContainText(sendSlowPickerAmount!);

  await page.getByRole('button', { name: SWITCH_TO_FAST }).click();
  await expect(page.getByText(SLOW_REMINDER)).toHaveCount(0);

  await sendFeeRow.click();
  await page.getByRole('button', { name: /Custom icon/ }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(CUSTOM_REMINDER)).toBeVisible();
  await sendFeeRow.click();
  const sendCustomPicker = page.getByRole('button', { name: /Custom icon/ });
  await expect(sendCustomPicker).toHaveAttribute('aria-pressed', 'true');
  const sendCustomPickerAmount = await feeAmount(sendCustomPicker);
  await page.keyboard.press('Escape');
  await expect(sendFeeRow).toContainText(sendCustomPickerAmount!);

  await page.getByRole('button', { name: SWITCH_TO_FAST }).click();
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);

  // Regression: a quote without amount.value must format identically in the
  // row and the highlighted picker row (fiat fallback or token + symbol).
  sendFeeValue = null;
  await page.reload();
  const nullFiatRow = page
    .getByRole('button')
    .filter({ hasText: 'Network Fee' })
    .first();
  await expect(nullFiatRow).toBeVisible({ timeout: 30_000 });
  await nullFiatRow.click();
  const nullFiatPicker = page.getByRole('button', { name: /Fast icon/ });
  await expect(nullFiatPicker).toHaveAttribute('aria-pressed', 'true');
  const nullFiatPickerText = await feeText(nullFiatPicker);
  await page.keyboard.press('Escape');
  await expect(nullFiatRow).toContainText(nullFiatPickerText);

  // The Custom picker row and the custom form summary use the same fallbacks.
  await nullFiatRow.click();
  const nullFiatCustomRow = page.getByRole('button', {
    name: /Custom icon/,
  });
  const nullFiatCustomPickerText = await feeText(nullFiatCustomRow);
  await nullFiatCustomRow.click();
  const expectedFeeText = parseFeeText(
    (await page.getByText('Expected Fee').locator('..').textContent()) ?? ''
  );
  expect(expectedFeeText).toBe(nullFiatCustomPickerText);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(CUSTOM_REMINDER)).toBeVisible();
  await expect(nullFiatRow).toContainText(nullFiatCustomPickerText);
});

test('keeps the acceleration fee UI unchanged', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 440, height: 700 });
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

  await page.goto(`${extensionPopupUrl}#/overview/history`);
  await page.waitForTimeout(500);
  await page.evaluate(
    ({ address }) => {
      const hash = `0x${'11'.repeat(32)}`;
      const transaction = {
        hash,
        from: address,
        to: '0xea79c0adb4f9d249770a8752fc6c0020999c52a0',
        nonce: 1,
        gasLimit: '0x5208',
        gasPrice: '0x0',
        data: '0x',
        value: '0x0',
        chainId: 1,
        type: 2,
        maxFeePerGas: '0x6fc23ac00',
        maxPriorityFeePerGas: '0x3b9aca00',
      };
      (
        window as unknown as {
          localTransactionsStore: {
            setState(value: unknown[]): void;
          };
        }
      ).localTransactionsStore.setState([
        { hash, transaction, timestamp: Date.now(), initiator: address },
      ]);
    },
    { address: testWallets.alice.address }
  );

  const openAcceleration = async (action: 'Speed Up' | 'Cancel') => {
    await expect(page.getByText('Pending').first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByText('Pending').first().click();
    await page.getByRole('button', { name: action }).click();
    const feeRow = page.getByRole('button', { name: 'Network Fee' }).first();
    await expect(feeRow).toBeVisible({ timeout: 30_000 });
    return feeRow;
  };

  const editCustomFee = async () => {
    await page.getByRole('button', { name: 'Network Fee' }).first().click();
    const maxFee = page.locator('input[name="maxFee"]');
    await expect(maxFee).toBeVisible({ timeout: 15_000 });
    await maxFee.fill('35');
    await page.getByRole('button', { name: 'Save' }).click();
  };

  const assertUnchanged = async () => {
    await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: SWITCH_TO_FAST })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Network Fee' }).first()
    ).toContainText('Custom');
  };

  const speedUpFee = await openAcceleration('Speed Up');
  await editCustomFee();
  await expect(speedUpFee).toContainText('Custom');
  await assertUnchanged();

  await page.goBack();
  await openAcceleration('Cancel');
  await editCustomFee();
  await assertUnchanged();
});

test('keeps custom fee values after switching to Fast', async ({
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
  await openFeeDialog(page);
  await page.getByRole('button', { name: /Custom icon/ }).click();
  const maxFee = page.locator('input[name="maxFee"]');
  await maxFee.fill('33');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByText(CUSTOM_REMINDER)).toBeVisible();

  // Switching to Fast keeps the custom values but makes Fast the active level.
  await page.getByRole('button', { name: SWITCH_TO_FAST }).click();
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);

  await openTransaction(page, extensionPopupUrl, '0x2');
  await expect(page.getByText(CUSTOM_REMINDER)).toHaveCount(0);
  await openFeeDialog(page);
  await page.getByRole('button', { name: /Custom icon/ }).click();
  await expect(page.locator('input[name="maxFee"]')).toHaveValue('33');
});
