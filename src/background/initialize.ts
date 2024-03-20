import { prepareStorage } from 'src/shared/core/version';
import { DnaService } from 'src/modules/dna-service/dna.background';
import { initialize as initializeAnalytics } from 'src/shared/analytics/analytics.background';
import { initialize as initializeRemoteConfig } from 'src/modules/remote-config';
import { initialize as initializeLiteweightChainSupport } from './requests/liteweight-chain-support';
import { Account, AccountPublicRPC } from './account/Account';
import { TransactionService } from './transactions/TransactionService';
import { globalPreferences } from './Wallet/GlobalPreferences';
import { NotificationWindow } from './NotificationWindow/NotificationWindow';
import { setUninstallURL } from './uninstall';

let didInitialize = false;

export async function initialize() {
  if (didInitialize) {
    throw new Error('Initialize function should be run only once');
  }
  didInitialize = true;

  await prepareStorage();

  // This method is called only when background script runs for the first time
  // This means that either the user is opening the extension for the first time,
  // or that the browser decided to "restart" the background scripts
  // Either way, we either create a user from scratch or find one in storage
  await Account.ensureUserAndWallet();

  const notificationWindow = new NotificationWindow();
  await notificationWindow.initialize();
  const account = new Account({ notificationWindow });
  await account.initialize();
  const accountPublicRPC = new AccountPublicRPC(account);
  const transactionService = new TransactionService();
  const dnaService = new DnaService(account);
  dnaService.initialize();
  await transactionService.initialize();
  initializeRemoteConfig().then(() => {
    globalPreferences.initialize();
    setUninstallURL();
  });
  console.log('initialize.ts: will initializeAnalytics');
  initializeAnalytics({ account });
  initializeLiteweightChainSupport(account);

  Object.assign(globalThis, {
    account,
    Account,
    accountPublicRPC,
    dnaService,
    transactionService,
    globalPreferences,
    notificationWindow,
  });
  return {
    account,
    accountPublicRPC,
    transactionService,
    dnaService,
    notificationWindow,
  };
}
