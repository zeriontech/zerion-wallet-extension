import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class ForgotPasswordPage extends ExtensionPage {
  readonly tryPasswordAgainLink = this.page.getByRole('link', {
    name: /Try Password Again/i,
  });
  readonly clearAllDataButton = this.page.getByRole('button', {
    name: /Clear All Data/i,
  });

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Forgot Password
        - heading "Forgot your password?" [level=1]
        - list:
          - listitem:
            - strong: We’re unable to recover the password
            - text: for you because it’s stored securely and locally only on your computer. Try entering the correct password again.
          - listitem: Alternatively, you can create a new account and password by deleting your data and import your wallets again with the recovery phrase or private keys.
        - link "Try Password Again"
        - button "Clear All Data"
    `);
  }
}
