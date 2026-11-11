import { expect, type BrowserContext, type Page } from '@playwright/test';
import { DAPP_URL } from 'e2e/dapp/config';

/**
 * A dapp RPC request opened in a separate extension window. Every approval
 * surface (connect, sign, send, switch, add chain) is one of these.
 */
export class ApprovalWindow {
  constructor(readonly page: Page) {}

  get dialog() {
    return this.page.locator('body');
  }

  async approveConnect() {
    await this.clickButton(/^Connect$/);
  }

  async rejectConnect() {
    await this.clickButton(/^Cancel$/);
  }

  async expectConnectRequest() {
    const origin = new URL(DAPP_URL);
    await expect(this.dialog).toContainText('Wants to connect to your wallet');
    // The approval header shows the hostname, without the port.
    await expect(this.dialog).toContainText(origin.hostname);
  }

  async expectSignMessage(message?: string) {
    await expect(this.dialog).toContainText('Sign Message');
    if (message) {
      await expect(this.dialog).toContainText(message);
    }
  }

  async expectTypedData(title: 'Sign Message' | 'Permit' = 'Sign Message') {
    await expect(this.dialog).toContainText(title);
    await expect(this.dialog).toContainText('Data');
  }

  async approveSignature() {
    await this.clickButton(/^Sign$/);
  }

  async rejectSignature() {
    await this.clickButton(/^Cancel$/);
  }

  async expectSendTransaction() {
    await expect(this.dialog).toContainText('Sign Transaction');
  }

  async cancelTransaction() {
    await this.clickButton(/^Cancel$/);
  }

  async expectSwitchChain(chainName: string, chainId: string) {
    await expect(this.dialog).toContainText('Suggests you switch current network');
    await expect(this.dialog).toContainText(chainName);
    await expect(this.dialog).toContainText(chainId);
  }

  async rejectSwitch() {
    await this.clickButton(/^Reject$/);
  }

  async expectAddOrUpdateChain(chainName: string) {
    await expect(this.dialog).toContainText(/Suggests you (add|update)/);
    await expect(this.dialog).toContainText(chainName);
  }

  /**
   * Accepts the RPC URL update/add, then waits for the success screen and
   * closes it. `wallet_addEthereumChain` resolves only after this.
   */
  async acceptAddOrUpdateChain() {
    await this.clickButton(/^Accept$/);
    await expect(this.dialog).toContainText(
      /(RPC URL updated successfully|Network added successfully)/,
    );
    await this.clickButton(/^Close$/);
  }

  private async clickButton(name: RegExp) {
    await this.page.locator('button', { hasText: name }).last().click();
  }
}

/**
 * Starts listening for the extension's approval window before an action that
 * may open one. Pages in `except` (the dapp and any raw-request page) are
 * ignored.
 */
export async function captureApprovalWindow(
  context: BrowserContext,
  action: () => Promise<void>,
  except: Page[] = [],
): Promise<ApprovalWindow> {
  const popupPromise = context.waitForEvent('page', {
    predicate: (page) => !except.includes(page),
    timeout: 30_000,
  });
  await action();
  const page = await popupPromise;
  await page.waitForLoadState('domcontentloaded');
  expect(new URL(page.url()).protocol).toBe('chrome-extension:');
  return new ApprovalWindow(page);
}
