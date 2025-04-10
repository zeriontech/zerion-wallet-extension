import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class ConnectLedgerPage extends ExtensionPage {
  readonly connectButton = this.page.getByRole('button', {});

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - img
        - button "Go back"
        - contentinfo:
          - text: We never store your keys. Please find more details in our
          - link "Privacy Policy."
    `);
  }
}
