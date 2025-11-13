import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class OverviewPage extends ExtensionPage {
  async ready() {
    await expect(this.page.getByText(/Get started/i)).toBeInViewport();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - link "0xc3A66…5Cbb1":
          - img
        - button "Copy Address":
          - img
        - link "Rewards":
          - img
        - link "Search":
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
        - link "Premium banner decoration Get Premium Lower fees, PnL and more":
          - img "Premium banner decoration"
          - img
        - button "close":
          - img
        - link "Tokens"
        - link "NFTs"
        - link "History"
        - link "Perks"
        - button "All Networks":
          - img
        - text: Get Started By adding crypto to your wallet
        - button "Fund":
          - img
    `);
  }
}
