import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class OverviewPage extends ExtensionPage {
  async ready() {
    await expect(this.page.getByText(/No assets yet/i)).toBeInViewport();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - link /0x[\\w\\W]{5}…[\\w\\W]{5}/:
          - img
        - button "Copy Address":
          - img
        - link "Rewards":
          - img
        - link "Settings":
          - img
        - button "Open Sidepanel":
          - img
        - text: /\\$\\d+\\.\\d+/
        - list:
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link "Swap":
              - img
        - link "Invite Friends Earn XP & Gift Free Premium":
          - img
        - button "close":
          - img
        - link "Tokens"
        - link "NFTs"
        - link "History"
        - link "Perks"
        - text: 🥺 No assets yet
    `);
  }
}
