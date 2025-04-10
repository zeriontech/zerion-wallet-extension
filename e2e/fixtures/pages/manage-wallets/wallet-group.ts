import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class WalletGroupPage {
  readonly nameInput = this.page.getByPlaceholder('Group Name');
  readonly recoveryPhraseLink = this.page.getByRole('link', {
    name: /Recovery Phrase/i,
  });
  readonly addWalletLink = this.page.getByRole('link', {
    name: /\+ Add Wallet/i,
  });
  readonly removeGroupButton = this.page.getByRole('button', {
    name: /Remove Group/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
    `);
  }
}
