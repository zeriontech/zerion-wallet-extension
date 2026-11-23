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

  /**
   * The login view renders nothing while `account/getExistingUser` is in
   * flight and an error screen if that request fails, which happens right
   * after locking when the service worker is restarting. Wait for the form or
   * that error screen, and reload immediately when the screen shows instead of
   * waiting out the form timeout.
   */
  async waitForUnlockForm() {
    const errorScreen = this.page.getByText('Unable to perform this action right now');
    await expect(this.passwordInput.or(errorScreen)).toBeVisible({ timeout: 20_000 });
    if (await errorScreen.isVisible()) {
      await this.page.reload();
      await expect(this.passwordInput).toBeVisible({ timeout: 20_000 });
    }
  }

  async unlock(password: string) {
    await this.waitForUnlockForm();
    await this.passwordInput.fill(password);
    await this.unlockButton.click();
  }

  async help() {
    await this.needHelpLink.click();
  }
}
