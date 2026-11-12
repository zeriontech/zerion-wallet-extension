import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

/**
 * `/perps/deposit` and `/perps/withdraw` are lazily imported from
 * `src/ui/App/App.tsx`. The copy asserted below lives in the Perps module
 * itself, not in the shared loading view, so it only renders after the
 * dynamically imported chunk has loaded.
 */
export class PerpsDepositPage extends ExtensionPage {
  readonly settleNotice = this.page.getByText(
    'Funds may take a few minutes to settle on Hyperliquid.',
  );

  async ready() {
    // The form waits for the positions request before it renders, so the first
    // paint can take longer than the default 5s expect timeout.
    await expect(this.page).toHaveTitle('Zerion · Deposit to Hyperliquid', { timeout: 30_000 });
    await expect(this.settleNotice).toBeVisible();
  }
}

export class PerpsWithdrawPage extends ExtensionPage {
  readonly receiveNotice = this.page.getByText(
    'You will receive USDC on Arbitrum in a few minutes.',
  );

  async ready() {
    await expect(this.page).toHaveTitle('Zerion · Withdraw USDC', { timeout: 30_000 });
    await expect(this.receiveNotice).toBeVisible();
  }
}
