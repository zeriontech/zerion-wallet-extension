import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

export class EraseDataConfirmationDialog {
  readonly eraseButton = this.dialog.getByRole('button', {
    name: /Erase My Data/i,
  });
  readonly backButton = this.dialog.getByRole('button', { name: /Back/i });
  readonly confirmationInput = this.dialog.getByRole('textbox', {
    name: /Type ERASE to confirm/i,
  });

  constructor(public readonly dialog: Locator) {}

  async matchesSnapshot() {
    await expect(this.dialog).toMatchAriaSnapshot(`
      - dialog:
        - img
        - text: Erase data for the browser extension? Every wallet in the browser extension will be erased and can only be restored from your recovery phrase or a backup. Your crypto assets remain secured on the blockchain. Type ERASE to confirm
        - textbox "Type ERASE to confirm"
        - button "Erase My Data" [disabled]
        - button "Back"
    `);
  }

  async confirm() {
    await this.confirmationInput.fill('ERASE');
    await this.eraseButton.click();
  }
}
