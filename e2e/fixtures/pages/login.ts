import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class LoginPage extends ExtensionPage {
  readonly passwordInput = this.page.getByPlaceholder('Password');
  readonly unlockButton = this.page.getByRole('button', { name: /Unlock/i });
  readonly needHelpLink = this.page.getByRole('link', { name: /Need Help?/i });

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - img
        - img
        - text: Welcome Back!
        - textbox "Welcome Back!"
        - button "Unlock"
        - link "Need Help?"
    `);
  }

  async unlock(password: string) {
    await this.passwordInput.fill(password);
    await this.unlockButton.click();
  }

  async help() {
    await this.needHelpLink.click();
  }
}
