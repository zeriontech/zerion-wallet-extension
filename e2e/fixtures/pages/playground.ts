import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

/**
 * `/playground` is lazily imported from `src/ui/App/App.tsx`, and the previews
 * list is itself lazily imported inside it, so the copy asserted below only
 * renders after both chunks have loaded.
 */
export class PlaygroundPage extends ExtensionPage {
  readonly heading = this.page.getByText('Component Previews');

  async ready() {
    await expect(this.page).toHaveTitle('Zerion · Component Previews', { timeout: 30_000 });
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }
}
