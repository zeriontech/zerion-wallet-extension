import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { DAPP_URL } from 'e2e/dapp/config';
import { ApprovalWindow, captureApprovalWindow } from './approval-window';

export type DappRpcResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error: { code?: number; message: string } };

export class TestDappPage {
  readonly useZerionButton: Locator;
  readonly providers: Locator;
  readonly accounts: Locator;
  readonly chainId: Locator;
  readonly connectionDetails: Locator;
  readonly ethAccountsResult: Locator;
  readonly permissionsResult: Locator;
  readonly personalSignButton: Locator;
  readonly personalSignResult: Locator;
  readonly typedDataV4Result: Locator;
  readonly siweResult: Locator;
  readonly permitVariantResult: Locator;
  readonly ethSignButton: Locator;
  readonly typedDataV3Result: Locator;
  readonly typedDataV1Result: Locator;
  readonly watchAssetStatus: Locator;
  readonly sendCallsError: Locator;

  constructor(
    readonly page: Page,
    readonly context: BrowserContext,
  ) {
    this.useZerionButton = page.getByRole('button', { name: /Use Zerion/i });
    this.providers = page.locator('#providers');
    this.accounts = page.locator('#accounts');
    this.chainId = page.locator('#chainId');
    this.connectionDetails = page.locator('#connectionDetails');
    this.ethAccountsResult = page.locator('#getAccountsResult');
    this.permissionsResult = page.locator('#permissionsResult');
    this.personalSignButton = page.locator('#personalSign');
    this.personalSignResult = page.locator('#personalSignResult');
    this.typedDataV4Result = page.locator('#signTypedDataV4Result');
    this.siweResult = page.locator('#siweResult');
    this.permitVariantResult = page.locator('#signPermitVariantResult');
    this.ethSignButton = page.locator('#ethSign');
    this.typedDataV3Result = page.locator('#signTypedDataV3Result');
    this.typedDataV1Result = page.locator('#signTypedDataResult');
    this.watchAssetStatus = page.locator('#eip747Status');
    this.sendCallsError = page.locator('#eip5792SendCallsError');
  }

  async goto() {
    let response;
    try {
      response = await this.page.goto(DAPP_URL, {
        waitUntil: 'domcontentloaded',
      });
    } catch (error) {
      throw new Error(
        `Test dapp is not reachable at ${DAPP_URL}. Set DAPP_URL to a running test dapp, for example https://zeriontech.github.io/zerion-test-dapp/ or http://localhost:9011. Original error: ${String(
          error,
        )}`,
      );
    }
    if (!response || !response.ok()) {
      throw new Error(
        `Test dapp at ${DAPP_URL} returned HTTP ${response?.status() ?? 'no response'}.`,
      );
    }
    // EIP-6963 is announced after the dapp listens for it. If the extension
    // did not inject, this fails with a clear locator timeout.
    await expect(this.useZerionButton).toBeVisible({ timeout: 30_000 });
  }

  async expectDiscovered() {
    await expect(this.providers).toContainText('Zerion');
    await expect(this.providers).toContainText('io.zerion.wallet');
    await expect(this.useZerionButton).toBeVisible();
  }

  async approveConnection(address: string) {
    const approval = await captureApprovalWindow(this.context, () => this.useZerionButton.click(), [
      this.page,
    ]);
    await approval.expectConnectRequest();
    await approval.approveConnect();
    await this.expectConnected(address);
  }

  async rejectConnection() {
    const approval = await captureApprovalWindow(this.context, () => this.useZerionButton.click(), [
      this.page,
    ]);
    await approval.expectConnectRequest();
    await approval.rejectConnect();
    await expect(this.accounts).toHaveText('');
  }

  async reconnect() {
    await this.useZerionButton.click();
  }

  async expectConnected(address: string) {
    // eslint-disable-next-line security/detect-non-literal-regexp -- address comes from the test fixture
    await expect(this.accounts).toContainText(new RegExp(address, 'i'));
  }

  async expectDisconnected() {
    await expect(this.accounts).toHaveText('');
  }

  async clearProvider() {
    await this.page.locator('#disconnectProviderButton').click();
    await expect(this.accounts).toHaveText('');
  }

  async getAccounts() {
    await this.page.locator('#getAccounts').click();
  }

  async expectAccountsResult(address: string) {
    await expect(this.ethAccountsResult).toContainText(
      // eslint-disable-next-line security/detect-non-literal-regexp -- address comes from the test fixture
      new RegExp(address, 'i'),
    );
  }

  async getPermissions() {
    await this.page.locator('#getPermissions').click();
  }

  async expectPermissions(result: string) {
    await expect(this.permissionsResult).toHaveText(result);
  }

  async selectNetwork(chainId: string) {
    await this.page.locator('#openNetworkPicker').click();
    await expect(this.page.locator('.network-modal')).toBeVisible();
    await this.page.locator(`.network-modal-item[data-chain-id="${chainId}"]`).click();
    await expect(this.chainId).toHaveText(chainId);
  }

  async clickAddEthereumChain() {
    await this.page.locator('#addEthereumChain').click();
  }

  async clickSendEth() {
    await this.page.locator('#sendButton').click();
  }

  async clickPersonalSign() {
    await this.personalSignButton.click();
  }

  async clickTypedDataV4() {
    await this.page.locator('#signTypedDataV4').click();
  }

  async clickSiwe() {
    await this.page.locator('#siwe').click();
  }

  async clickPermitSingle() {
    await this.page.locator('#signPermitSingle').click();
  }

  async clickEthSign() {
    await this.ethSignButton.click();
  }

  async clickTypedDataV3() {
    await this.page.locator('#signTypedDataV3').click();
  }

  async clickTypedDataV1() {
    await this.page.locator('#signTypedData').click();
  }

  async watchAsset() {
    await this.page
      .locator('#eip747ContractAddress')
      .fill('0x0000000000000000000000000000000000000001');
    await this.page.locator('#eip747Symbol').fill('TEST');
    await this.page.locator('#eip747Decimals').fill('18');
    await this.page.locator('#eip747WatchButton').click();
  }

  async sendCalls() {
    await this.page.locator('#eip5792SendCallsButton').click();
  }

  async expectSignature(result: Locator) {
    await expect(result).toHaveText(/^0x[0-9a-f]{130}$/i, { timeout: 30_000 });
  }

  /**
   * Waits for the extension window opened by a dapp action. The caller must
   * create the promise before performing the action.
   */
  async waitForApprovalWindow() {
    const page = await this.context.waitForEvent('page', {
      predicate: (candidate) => candidate !== this.page,
      timeout: 30_000,
    });
    await page.waitForLoadState('domcontentloaded');
    return new ApprovalWindow(page);
  }

  /**
   * Calls the provider from the dapp's own page context, like a dapp would.
   * Rejections are returned instead of thrown so tests can assert RPC error
   * codes.
   */
  async request<T>(method: string, params?: unknown): Promise<DappRpcResponse<T>> {
    return this.page.evaluate(
      async ({ method, params }) => {
        if (!window.ethereum) {
          throw new Error('window.ethereum is not available on the dapp page');
        }
        return window.ethereum.request({ method, params }).then(
          (result) => ({ ok: true as const, result }),
          (error: { code?: number; message?: string }) => ({
            ok: false as const,
            error: {
              code: error?.code,
              message: error?.message ?? String(error),
            },
          }),
        );
      },
      { method, params },
    );
  }

  async expectNoExtensionPages() {
    const extensionPages = this.context
      .pages()
      .filter((page) => page.url().startsWith('chrome-extension://'));
    expect(extensionPages).toHaveLength(0);
  }
}
