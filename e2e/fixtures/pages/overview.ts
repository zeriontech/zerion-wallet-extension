import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class OverviewPage extends ExtensionPage {
  async ready() {
    // The empty state renders after the portfolio request settles. When the
    // live API answers with a Cloudflare challenge, that can take longer than
    // the default 5s expect timeout.
    await expect(this.page.getByText(/Get started/i)).toBeInViewport({
      timeout: 30_000,
    });
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - link "0xc3A66…5Cbb1":
          - text: 0xc3A66…5Cbb1
          - img
        - button "Copy Address":
          - img
        - link "Search":
          - img
        - link "Settings":
          - img
        - button "Open Sidepanel":
          - img
        - list:
          - listitem:
            - link "Buy":
              - img
              - text: Buy
          - listitem:
            - link "Receive":
              - img
              - text: Receive
          - listitem:
            - button "Send":
              - img
              - text: Send
          - listitem:
            - link "Swap":
              - img
              - text: Swap
        - link "Tokens"
        - link "Perps"
        - link "History"
        - link "Stats"
        - link "NFTs"
        - button "All Networks":
          - text: All Networks
          - img
        - text: Get Started By adding crypto to your wallet
        - button "Fund":
          - img
          - text: Fund
    `);
  }
}
