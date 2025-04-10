import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

interface Props {
  buttonTitle?: string;
}

export class VerifyUserComponent {
  readonly UNLOCK_BUTTON_TITLE = 'Unlock';

  readonly passwordInput = this.page.getByPlaceholder('Enter password');
  readonly unlockButton = this.page.getByRole('button', {
    name: this.props?.buttonTitle ?? this.UNLOCK_BUTTON_TITLE,
  });

  constructor(public readonly page: Page, public readonly props?: Props) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Enter password
        - text: /Enter Password\\.*/
        - textbox "Enter password"
        - button
    `);
  }

  async unlock(password: string) {
    await this.passwordInput.fill(password);
    await this.unlockButton.click();
  }
}
