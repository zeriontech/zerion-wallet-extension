import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

export class EraseDataConfirmationDialog {
  readonly eraseButton = this.dialog.getByRole('button', {
    name: /Erase My Data/i,
  });
  readonly backButton = this.dialog.getByRole('button', { name: /Back/i });
  readonly eraseMyDataCheckbox = this.dialog.locator(
    'label > input[type="checkbox"] + div'
  );

  constructor(public readonly dialog: Locator) {}

  async matchesSnapshot() {
    await expect(this.dialog).toMatchAriaSnapshot(`
      - dialog:
        - img
        - text: Erase data for the browser extension? Your crypto assets remain secured on the blockchain and can be accessed with your private keys and recovery phrase Yes, erase my data
        - checkbox "Yes, erase my data"
        - button "Erase My Data"
        - button "Back"
    `);
  }

  async confirm() {
    await this.eraseMyDataCheckbox.check();
    await this.eraseButton.click();
  }
}
