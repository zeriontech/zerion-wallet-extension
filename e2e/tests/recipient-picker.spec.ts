import { testWallets } from 'e2e/fixtures/constants';
import { AddressBookPage } from 'e2e/fixtures/pages/address-book';
import { OverviewPage } from 'e2e/fixtures/pages/overview';
import { createExtensionTest } from './test';

interface RecipientPickerFixtures {
  addressBookPage: AddressBookPage;
  overviewPage: OverviewPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<RecipientPickerFixtures>({
  addressBookPage: async ({ extensionPopupUrl, page }, use) => {
    await use(
      new AddressBookPage(page, {
        extensionPopupUrl,
        path: '/address-book',
      })
    );
  },
  overviewPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new OverviewPage(page, { extensionPopupUrl, path: '/overview' }));
  },
});

const { describe, expect } = test;

const contact = {
  address: testWallets.bob.address,
  name: 'Saved Contact',
};

describe('Recipient picker', () => {
  test('shows the Address Book name for a searched address', async ({
    page,
    addressBookPage,
    overviewPage,
  }) => {
    await addressBookPage.navigateTo();
    await addressBookPage.addAddress(contact);

    await overviewPage.navigateTo();
    await overviewPage.openRecipientDialog();

    const dialog = page.getByRole('dialog');
    await dialog
      .getByPlaceholder('Address, domain or identity')
      .fill(contact.address.toLowerCase());

    await expect(dialog.getByText('Exact match')).toBeVisible();
    // The saved address is the exact match, so it is deduped out of the
    // Address Book section — the name has to come from the exact-match row.
    await expect(
      dialog.getByRole('option').filter({ hasText: contact.address })
    ).toContainText(contact.name);
  });
});
